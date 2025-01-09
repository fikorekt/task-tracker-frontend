import React, { useState, useEffect, useCallback } from 'react';
import { User, Plus } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000/api';
const socket = io('http://localhost:3000');
  

function App() {
  // State tanımlamaları aynı kalacak
  const [selectedDate, setSelectedDate] = useState('');
  const [filter, setFilter] = useState('all'); // Default olarak tüm görevler
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'normal'
  });
  

  // Kullanıcıları getir (admin ve kendisi hariç)
  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Kullanıcılar getirilemedi');

      const data = await response.json();
      // Admin değilse admin kullanıcısını ve kendisini listeden çıkar
      const filteredUsers = data.filter(user => {
        if (currentUser?.role === 'admin') return true; {
          return user.role !== 'admin' && user._id !== currentUser?.id;
        }
        return true;
      });
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  }, [token, currentUser]);

  // Görevleri sil

  {currentUser?.role === 'admin' && (
    <button
      onClick={() => handleDeleteTask(task._id)}
      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
    >
      Sil
    </button>
  )}
  

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
      } else {
        fetchTasks(); // Görevleri yeniden yükleyin
      }
    } catch (error) {
      console.error('Görev silme hatası:', error);
    }
  };
  

  // Görevleri getir
  const fetchTasks = useCallback(async () => {
    if (!token) return;
  
    try {
      const query = new URLSearchParams({
        filter,
      }).toString(); // Filtreyi backend'e gönderiyoruz
  
      const response = await fetch(`${API_URL}/tasks?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) throw new Error('Görevler getirilemedi');
  
      const data = await response.json();
      setTasks(data); // Backend'den gelen görevleri state'e kaydediyoruz
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
    }
  }, [token, filter]); // filter state'ine göre görevler yeniden yüklenecek
  
  
  
  // Görev durumunu güncelle
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      console.error('Görev güncellenirken hata:', error);
    }
  };

  // Token kontrolü ve veri yükleme
  useEffect(() => {
    
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    socket.on('new-task', (data) => {
      console.log('Yeni görev bildirimi:', data);
  
      // Sesli bildirim oynatma
      const audio = new Audio('/notification.mp3'); // Bildirim sesi dosyası
      audio.play();
    });
  
    return () => {
      socket.off('new-task');
    };
  }, []);

  // Token değişince verileri yükle
  useEffect(() => {
    if (token && isLoggedIn) {
      fetchUsers();
      fetchTasks();
    }
  }, [token, isLoggedIn, fetchUsers, fetchTasks, filter]);


  // Login fonksiyonu
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      setError('Giriş yapılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Görev ekleme fonksiyonu
  const handleAddTask = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'normal'
        });
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      console.error('Görev eklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış yapma fonksiyonu aynı kalacak
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setToken(null);
    setTasks([]);
    setUsers([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Login formu aynı kalacak
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Giriş Yap</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    );
  }


  // Ana panel return kısmı (tasks mapping güncellenecek)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Görev Takip Sistemi</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Hoş geldin, {currentUser?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Yeni Görev Formu */}
        {/* Yeni Görev Formu */}
{currentUser?.role === 'admin' && (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 className="text-xl font-bold mb-4">Yeni Görev Ekle</h2>
    <form onSubmit={handleAddTask}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Görev Başlığı"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="border rounded p-2"
          required
        />
        <select
          value={newTask.assignedTo}
          onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
          className="border rounded p-2"
          required
        >
          <option value="">Görev Atanacak Kişi</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <textarea
          placeholder="Görev Açıklaması"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full border rounded p-2 h-24"
          required
        />
      </div>
      <div className="flex justify-between gap-4">
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          className="border rounded p-2"
        >
          <option value="dusuk">Düşük Öncelik</option>
          <option value="normal">Normal Öncelik</option>
          <option value="yuksek">Yüksek Öncelik</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Ekleniyor...' : 'Görev Ekle'}
        </button>
      </div>
    </form>
  </div>
)}



        {/* Görev Listesi */}
        <div className="flex justify-between items-center mb-4">
  <div>
    <h2 className="text-xl font-bold">Görev Listesi</h2>
    
  </div>
  <select
  value={filter}
  onChange={(e) => {
    setFilter(e.target.value); // Kullanıcının seçimini state'e kaydediyoruz
  }}
  className="border rounded p-2"
>
  <option value="all">Tüm Görevler</option>
  <option value="assigned">Bana Atanan Görevler</option>
  <option value="created">Oluşturduğum Görevler</option>
</select>
</div>

        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task._id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold">{task.title}</h3>
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-gray-600 mt-1 max-h-24 overflow-y-auto break-words whitespace-pre-wrap">{task.description}</p>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Atanan: {task.assignedTo?.name || "Bilinmiyor"}</p>
                    <p>Oluşturan: {task.createdBy?.name || "Bilinmiyor"}</p>
                    <p>Son Güncelleyen: {task.lastUpdatedBy?.name || "Bilinmiyor"}</p>
                    <p className={`font-medium ${task.priority === 'yuksek' ? 'text-red-600' :
                      task.priority === 'normal' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                      Öncelik: {task.priority === 'yuksek' ? 'Yüksek' : task.priority === 'normal' ? 'Normal' : 'Düşük'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.status === 'tamamlandı' ? 'bg-green-100 text-green-800' :
                    task.status === 'calısılıyor' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status === 'tamamlandı' ? 'Tamamlandı' :
                     task.status === 'calısılıyor' ? 'Çalışılıyor' :
                     'Bekliyor'}
                  </span>
                  {currentUser?.role === 'admin' && (
    <button
      onClick={() => handleDeleteTask(task._id)}
      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
    >
      Sil
    </button>
    )}
                  

                  {/* Sadece görevi atanan kişi görev durumunu güncelleyebilir */}
                  {task.assignedTo?._id === currentUser?.id && (
                    <div className="w-full">
                      <div className="text-xs text-gray-500 mb-1">Görev Durumu</div>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                        className="border rounded p-1 text-sm w-full"
                      >
                        <option value="bekliyor">Bekliyor</option>
                        <option value="calısılıyor">Çalışılıyor</option>
                        <option value="tamamlandı">Tamamlandı</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              Henüz görev bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;