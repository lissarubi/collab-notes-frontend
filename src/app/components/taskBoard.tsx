"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SuperVizRoom, { LauncherFacade } from '@superviz/sdk';
import { Realtime, type Channel } from "@superviz/realtime/client";
import { v4 as generateId } from 'uuid';

interface Task {
  id: string;
  title: string;
  description: string;
  editing?: boolean; // Propriedade opcional para edição
  createdAt: number; // Timestamp para ordenar tarefas
}

const apiKey = process.env.NEXT_PUBLIC_SUPERVIZ_TOKEN || ""; // Access API key from environment
const ROOM_ID = 'collaborative-task-board';

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialized, setInitialized] = useState(false);
  const superviz = useRef<LauncherFacade | null>(null);
  const channel = useRef<Channel | null>(null);
  const participantId = useRef<string>(generateId()); // Generate participant ID
  const [title, setTitle] = useState(""); // State for title input
  const [description, setDescription] = useState(""); // State for description input
  const [aiPrompt, setAiPrompt] = useState(""); // Estado para prompt da IA
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null); // State for the typing timeout

  // Initialize SuperViz room
  const initialize = useCallback(async () => {
    if (initialized) return;

    try {
      superviz.current = await SuperVizRoom(apiKey, {
        roomId: ROOM_ID,
        participant: {
          id: participantId.current,
          name: "Participant " + participantId.current.slice(0, 5),
        },
        group: {
          id: 'task-board-group',
          name: 'task-board-group',
        }
      });

      const realtime = new Realtime(apiKey, { participant: { id: participantId.current } });
      channel.current = await realtime.connect("task-board-channel");

      channel.current.subscribe("new-task", handleRealtimeMessage);
      channel.current.subscribe("update-task", handleRealtimeUpdate);
      channel.current.subscribe("edit-task", handleRealtimeEdit);

      setInitialized(true);
    } catch (error) {
      console.error("Error initializing SuperViz room:", error);
    }
  }, [initialized]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSubmitTask = () => {
    if (title && description) {
      const newTask: Task = {
        id: generateId(),
        title,
        description,
        editing: false,
        createdAt: Date.now(),
      };

      channel.current?.publish("new-task", newTask);
      setTitle("");
      setDescription("");
    }
  };

  const handleGenerateAiTask = async () => {
    if (!aiPrompt) return;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [{ 
                    role: "user", 
                    content: `Please generate a kanban task with a JSON response in the format: \`{title: <TaskTitle>, description: <TaskDescription>}\`, don't forget to put double quotes around strings, and open/close the JSON correctly, using "{}". Return only the JSON in the response, because the raw content will be parsed with JSON. Also, the content need to be in plain text, without formatting, lists, bullet points, bold,etc. Task Prompt: ${aiPrompt}` 
                }],
                model: "llama3-8b-8192",
                temperature: 0.57,
            }),
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        console.log(aiResponse);

        // Validação do JSON
        const formattedResponse = (aiResponse.startsWith('{') ? '' : '{') + aiResponse + (aiResponse.endsWith('}') ? '' : '}');

        // Parse the JSON response from Groq
        const { title, description } = JSON.parse(formattedResponse);

        const newTask: Task = {
            id: generateId(),
            title: title || "Generated Task",
            description: description || "No description available",
            editing: false,
            createdAt: Date.now(),
        };

        channel.current?.publish("new-task", newTask);
        setAiPrompt(""); // Limpa o campo de prompt
    } catch (error) {
        console.error("Error generating task with AI:", error);
    }
};

const handleRewriteTaskWithAI = async (task: Task) => {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "user", 
                        content: `Please rewrite the following task to be more formal, detailed, and aligned with a kanban format, returning a JSON response in the format: \`{title: <TaskTitle>, description: <TaskDescription>}\`, don't forget to put double quotes around strings, and open/close the JSON correctly, using "{}". Return only the rewrited task JSON in the response, without any explanation or introdutory text, because the raw content will be parsed with JSON. Also, the content need to be in plain text, without formatting, lists, bullet points, bold,etc.:
                        Title: "${task.title}", Description: "${task.description}"`
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.57,
            }),
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        console.log(aiResponse);
        // Validação do JSON
        const formattedResponse = (aiResponse.startsWith('{') ? '' : '{') + aiResponse + (aiResponse.endsWith('}') ? '' : '}');

        // Parse the JSON response from Groq
        const { title, description } = JSON.parse(formattedResponse);

        // Update the task with the new title and description
        const updatedTask: Task = { ...task, title, description };
        channel.current?.publish("update-task", updatedTask);
        setTasks(prevTasks =>
            prevTasks.map(t => (t.id === task.id ? updatedTask : t))
        );

    } catch (error) {
        console.error("Error rewriting task with AI:", error);
    }
};


  const handleRealtimeMessage = useCallback((message: any) => {
    const newTask: Task = message.data;

    if (!tasks.some(task => task.id === newTask.id)) {
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }
  }, [tasks]);

  const handleRealtimeUpdate = useCallback((message: any) => {
    const updatedTask: Task = message.data;

    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  const handleRealtimeEdit = useCallback((message: any) => {
    const taskId: string = message.data;

    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === taskId ? { ...task, editing: true } : task))
    );
  }, []);

  const handleEditTask = (task: Task) => {
    channel.current?.publish("edit-task", task.id);
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === task.id) {
        return { ...t, editing: true };
      }
      return t;
    }));
  };

  // Nova função para lidar com mudanças nos campos de edição
  const handleInputChange = (task: Task, field: 'title' | 'description', value: string) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === task.id) {
        return { ...t, [field]: value }; // Atualiza o campo especificado
      }
      return t;
    }));

    // Limpa o timeout anterior
    if (typingTimeout) clearTimeout(typingTimeout);

    // Define um novo timeout de 600ms
    const newTimeout = setTimeout(() => {
      // Publica a atualização após o delay
      channel.current?.publish("update-task", {
        ...task,
        [field]: value,
        editing: true
      });
    }, 600);

    setTypingTimeout(newTimeout);
  };

  const handleSaveTask = (task: Task) => {
    const updatedTask: Task = { ...task, editing: false };

    channel.current?.publish("update-task", updatedTask);
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === task.id ? updatedTask : t))
    );
  };

  return (
    <>
      <div className="container">
        <header className="header">
          <h1>Collaborative Task List</h1>
        </header>
  
        <div className="task-input">
          <h3>Add New Task</h3>
          <input
            type="text"
            placeholder="Title"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Description"
            className="textarea-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button onClick={handleSubmitTask} className="add-task-button">
            Create Task
          </button>
        </div>
  
        <div className="ai-task-input">
          <h3>Create Task with AI</h3>
          <textarea
            placeholder="Describe the task you want to create..."
            className="textarea-field"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button onClick={handleGenerateAiTask} className="add-task-button">
            Generate Task with AI
          </button>
        </div>
  
        <div className="task-list">
          <h3>Tasks</h3>
          <div className="tasks-container">
            {tasks
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((task) => (
                <div key={task.id} className="task-item">
                  {task.editing ? (
                    <>
                      <input
                        type="text"
                        value={task.title}
                        className="input-field"
                        onChange={(e) =>
                          handleInputChange(task, "title", e.target.value)
                        }
                      />
                      <textarea
                        value={task.description}
                        className="textarea-field"
                        onChange={(e) =>
                          handleInputChange(task, "description", e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleSaveTask(task)}
                        className="save-task-button"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="edit-task-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRewriteTaskWithAI(task)}
                        className="rewrite-task-button"
                      >
                        Rewrite with AI
                      </button>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
  
      <style jsx>{`
        .container {
          padding: 20px;
          background-color: #121212;
          color: #ffffff;
          max-width: 800px;
          margin: auto;
          height: 100vh;
          overflow-y: auto; /* Garantir scroll na página inteira */
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .task-input,
        .ai-task-input,
        .task-list {
          background-color: #333333;
          border: 1px solid #555555;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .input-field,
        .textarea-field {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          background-color: #2c2c2c;
          color: #ffffff;
          border: 1px solid #444;
          border-radius: 5px;
        }
        .add-task-button,
        .save-task-button,
        .edit-task-button,
        .rewrite-task-button {
          padding: 10px;
          color: #ffffff;
          background-color: #6200ea;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 5px; /* Espaçamento entre os botões */
        }
        .tasks-container {
          max-height: 50vh;
          overflow-y: auto; /* Scroll interno para lista de tarefas */
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .task-item {
          padding: 15px;
          background-color: #1c1c1c;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
};

export default TaskBoard;
