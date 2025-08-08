import React, { useState, useEffect } from 'react';
import { Search, Bell, Download, Calendar, Filter, AlertCircle, CheckCircle, Clock, Building2, FileText, Users, Wifi, WifiOff, Globe, Share2 } from 'lucide-react';

const DOMScraperApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchType, setSearchType] = useState('todos');
  const [alerts, setAlerts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [newAlertKeyword, setNewAlertKeyword] = useState('');

  // API configurada com sua URL do Railway
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://dom-pbh-backend-production.up.railway.app/api'
    : 'http://localhost:3001/api';

  // Verificar status do servidor
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts`);
      if (response.ok) {
        setServerStatus('online');
        return true;
      } else {
        setServerStatus('offline');
        return false;
      }
    } catch (error) {
      setServerStatus('offline');
      return false;
    }
  };

  // Carregar alertas do backend
  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts`);
      if (response.ok) {
        const alertsData = await response.json();
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  // Realizar busca real
  const handleSearch = async () => {
    if (serverStatus !== 'online') {
      alert('Sistema offline! Tente novamente em alguns minutos.');
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: searchTerm,
          date: searchDate,
          type: searchType === 'todos' ? null : searchType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        const error = await response.json();
        alert(`Erro na busca: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao realizar busca:', error);
      alert('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle de alerta
  const toggleAlert = async (id) => {
    try {
      const alert = alerts.find(a => a.id === id);
      const response = await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alert,
          active: !alert.active
        })
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Erro ao atualizar alerta:', error);
    }
  };

  // Adicionar novo alerta
  const addNewAlert = async () => {
    if (!newAlertKeyword.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: newAlertKeyword.trim()
        })
      });

      if (response.ok) {
        setNewAlertKeyword('');
        await loadAlerts();
      }
    } catch (error) {
      console.error('Erro ao adicionar alerta:', error);
    }
  };

  // Verificar alertas manualmente
  const checkAlertsManually = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts/check`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Alertas verificados! ${data.newResults} novos resultados encontrados.`);
        await loadAlerts();
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }
  };

  // Compartilhar aplicação
  const shareApp = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Monitor DOM PBH',
        text: 'Sistema de monitoramento do Diário Oficial Municipal de Belo Horizonte',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  // Exportar resultados
  const exportResults = () => {
    const dataStr = JSON.stringify(searchResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dom-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Ícone por tipo
  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'nomeação': return <Users className="w-4 h-4" />;
      case 'contrato': return <FileText className="w-4 h-4" />;
      case 'licitação': return <Building2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Status do servidor
  const getServerStatusIcon = () => {
    switch (serverStatus) {
      case 'online': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  // Efeitos
  useEffect(() => {
    checkServerStatus().then(isOnline => {
      if (isOnline) {
        loadAlerts();
      }
    });
    
    // Verificar status do servidor a cada 30 segundos
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Monitor DOM PBH</h1>
                <p className="text-sm text-gray-500">Sistema Compartilhável - Diário Oficial Municipal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={shareApp}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
              <div className="flex items-center space-x-2">
                {getServerStatusIcon()}
                <span className="text-sm font-medium">
                  {serverStatus === 'online' ? 'Sistema Online' : 
                   serverStatus === 'offline' ? 'Sistema Offline' : 'Conectando...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">🎉 Bem-vindo ao Monitor DOM PBH!</h2>
              <p className="text-blue-100">Monitore nomeações, contratos e licitações automaticamente</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Sistema Online</p>
              <p className="text-2xl font-bold">🚀</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Alertas
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'search' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Busca Manual
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => a.active).length}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Alertas</p>
                    <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status do Sistema</p>
                    <p className="text-lg font-bold text-gray-900">
                      {serverStatus === 'online' ? 'Operacional' : 'Verificando...'}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${
                    serverStatus === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
              </div>
            </div>

            {/* Alerts Management */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciar Alertas</h2>
                <button
                  onClick={checkAlertsManually}
                  disabled={serverStatus !== 'online'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                >
                  Verificar Agora
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          disabled={serverStatus !== 'online'}
                          className={`w-10 h-6 rounded-full ${
                            alert.active ? 'bg-blue-600' : 'bg-gray-300'
                          } relative transition-colors disabled:opacity-50`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            alert.active ? 'translate-x-5' : 'translate-x-1'
                          }`}></div>
                        </button>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{alert.keyword}</p>
                          <p className="text-sm text-gray-500">
                            Última verificação: {new Date(alert.lastCheck).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {(alert.results || []).length} resultados
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          alert.active ? 'bg-green-400' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Adicionar Novo Alerta</h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAlertKeyword}
                      onChange={(e) => setNewAlertKeyword(e.target.value)}
                      placeholder="Digite palavra-chave..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addNewAlert()}
                    />
                    <button 
                      onClick={addNewAlert}
                      disabled={serverStatus !== 'online' || !newAlertKeyword.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Busca Manual no DOM PBH</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavra-chave
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ex: nomeações, contratos, licitações..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="nomeação">Nomeação</option>
                    <option value="contrato">Contrato</option>
                    <option value="licitação">Licitação</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleSearch}
                  disabled={isSearching || serverStatus !== 'online'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                >
                  {isSearching ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Buscando no DOM PBH...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
                {searchResults.length > 0 && (
                  <button
                    onClick={exportResults}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resultados ({searchResults.length})
                  </h2>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {searchResults.map(result => (
                    <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(result.type)}
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {result.type}
                            </span>
                            <span className="text-sm text-gray-500">{result.date}</span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {result.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{result.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && !isSearching && serverStatus === 'online' && (
              <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Faça sua primeira busca no DOM PBH
                </h3>
                <p className="text-gray-500">
                  Digite uma palavra-chave como "nomeações" ou "contratos"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DOMScraperApp;
