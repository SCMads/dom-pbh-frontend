import React, { useState, useEffect } from 'react';
import { Search, Bell, Download, Calendar, Filter, AlertCircle, CheckCircle, Clock, Building2, FileText, Users, Wifi, WifiOff, Globe, Share2, Mail, FileDown } from 'lucide-react';

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
  const [emailConfig, setEmailConfig] = useState({ email: '', frequency: 'daily' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('txt');

  // API configurada para produção e desenvolvimento
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://dom-pbh-backend-production.up.railway.app/api'
    : 'http://localhost:3001/api';

  // Verificar status do servidor
  const checkServerStatus = async () => {
    try {
      // Usamos um endpoint simples e rápido como o de alertas para checar
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

  // Realizar busca
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

  // Gerar resumo em texto
  const generateTextSummary = (results) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    let summary = `========================================\n`;
    summary += `RELATÓRIO DOM PBH - DIÁRIO OFICIAL\n`;
    summary += `========================================\n\n`;
    summary += `Data do Relatório: ${dateStr}\n`;
    summary += `Hora: ${timeStr}\n`;
    summary += `Total de Resultados: ${results.length}\n`;
    summary += `Palavra-chave: ${searchTerm || 'Todos'}\n`;
    summary += `Tipo: ${searchType || 'Todos'}\n\n`;
    
    summary += `----------------------------------------\n`;
    summary += `RESUMO EXECUTIVO\n`;
    summary += `----------------------------------------\n\n`;
    
    // Contadores
    const byType = {};
    const byOrgan = {};
    let totalValue = 0;
    const people = [];
    const companies = [];
    
    results.forEach(r => {
      // Contar por tipo
      byType[r.type] = (byType[r.type] || 0) + 1;
      
      // Contar por órgão
      if (r.organ) {
        byOrgan[r.organ] = (byOrgan[r.organ] || 0) + 1;
      }
      
      // Coletar pessoas e empresas
      if (r.person) people.push(r.person);
      if (r.company) companies.push(r.company);
      
      // Somar valores
      if (r.value) {
        const valor = r.value.replace(/[^\d,]/g, '').replace(',', '.');
        totalValue += parseFloat(valor) || 0;
      }
    });
    
    // Estatísticas por tipo
    summary += `📊 DISTRIBUIÇÃO POR TIPO:\n`;
    Object.entries(byType).forEach(([tipo, count]) => {
      summary += `    • ${tipo}: ${count} (${((count/results.length)*100).toFixed(1)}%)\n`;
    });
    summary += '\n';
    
    // Estatísticas por órgão
    if (Object.keys(byOrgan).length > 0) {
      summary += `🏛️ ÓRGÃOS ENVOLVIDOS:\n`;
      Object.entries(byOrgan)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([orgao, count]) => {
          summary += `    • ${orgao}: ${count} publicações\n`;
        });
      summary += '\n';
    }
    
    // Pessoas nomeadas
    if (people.length > 0) {
      summary += `👥 PESSOAS NOMEADAS:\n`;
      [...new Set(people)].slice(0, 10).forEach(person => {
        summary += `    • ${person}\n`;
      });
      summary += '\n';
    }
    
    // Empresas contratadas
    if (companies.length > 0) {
      summary += `🏢 EMPRESAS CONTRATADAS:\n`;
      [...new Set(companies)].slice(0, 10).forEach(company => {
        summary += `    • ${company}\n`;
      });
      if (totalValue > 0) {
        summary += `\n💰 VALOR TOTAL DOS CONTRATOS: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
      summary += '\n';
    }
    
    summary += `\n========================================\n`;
    summary += `DETALHAMENTO COMPLETO\n`;
    summary += `========================================\n\n`;
    
    // Detalhes de cada resultado
    results.forEach((result, index) => {
      summary += `----------------------------------------\n`;
      summary += `REGISTRO #${index + 1}\n`;
      summary += `----------------------------------------\n`;
      summary += `Tipo: ${result.type}\n`;
      summary += `Título: ${result.title}\n`;
      summary += `Data: ${result.date}\n`;
      
      if (result.organ) summary += `Órgão: ${result.organ}\n`;
      if (result.person) summary += `Pessoa: ${result.person}\n`;
      if (result.position) summary += `Cargo: ${result.position}\n`;
      if (result.company) summary += `Empresa: ${result.company}\n`;
      if (result.value) summary += `Valor: ${result.value}\n`;
      if (result.object) summary += `Objeto: ${result.object}\n`;
      
      summary += `\nConteúdo:\n${result.content}\n\n`;
    });
    
    summary += `========================================\n`;
    summary += `FIM DO RELATÓRIO\n`;
    summary += `========================================\n`;
    summary += `\nGerado pelo Sistema Monitor DOM PBH\n`;
    summary += `https://dom-pbh-frontend.vercel.app\n`;
    
    return summary;
  };

  // Exportar resultados
  const exportResults = (format = 'txt') => {
    if (searchResults.length === 0) {
      alert('Não há resultados para exportar!');
      return;
    }
    
    if (format === 'txt') {
      const textContent = generateTextSummary(searchResults);
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-dom-pbh-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const dataStr = JSON.stringify(searchResults, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dom-results-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Configurar email para alertas
  const configureEmailAlerts = async () => {
    if (!emailConfig.email) {
      alert('Por favor, insira um email válido!');
      return;
    }
    
    try {
      // Este endpoint precisa ser criado no backend
      const response = await fetch(`${API_BASE}/email/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig)
      });
      
      if (response.ok) {
        alert('Email configurado com sucesso! Você receberá relatórios.');
        setShowEmailModal(false);
        localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
      } else {
        alert('Erro ao configurar email. Verifique se o backend suporta esta funcionalidade.');
      }
    } catch (error) {
      console.error('Erro ao configurar email:', error);
      alert('Erro ao configurar email. Verifique se o backend suporta esta funcionalidade.');
    }
  };

  // Enviar relatório por email manualmente
  const sendReportByEmail = async () => {
    const savedEmail = localStorage.getItem('emailConfig');
    if (!savedEmail) {
      setShowEmailModal(true);
      return;
    }
    
    const config = JSON.parse(savedEmail);
    
    try {
      // Este endpoint precisa ser criado no backend
      const response = await fetch(`${API_BASE}/email/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.email,
          alerts: alerts.filter(a => a.active),
          results: searchResults
        })
      });
      
      if (response.ok) {
        alert(`Relatório enviado para ${config.email}!`);
      } else {
        alert('Erro ao enviar relatório. Verifique se o backend suporta esta funcionalidade.');
      }
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      alert('Erro ao enviar relatório. Verifique se o backend suporta esta funcionalidade.');
    }
  };

  // Toggle de alerta
  const toggleAlert = async (id) => {
    try {
      const alert = alerts.find(a => a.id === id);
      const response = await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...alert, active: !alert.active })
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newAlertKeyword.trim() })
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
      const response = await fetch(`${API_BASE}/alerts/check`, { method: 'POST' });
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
    
    const savedEmail = localStorage.getItem('emailConfig');
    if (savedEmail) {
      setEmailConfig(JSON.parse(savedEmail));
    }
    
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Modal de Configuração de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Configurar Alertas por Email</h3>
            <input
              type="email"
              placeholder="seu@email.com"
              value={emailConfig.email}
              onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-md mb-3"
            />
            <select
              value={emailConfig.frequency}
              onChange={(e) => setEmailConfig({...emailConfig, frequency: e.target.value})}
              className="w-full px-3 py-2 border rounded-md mb-4"
            >
              <option value="daily">Diário (8h da manhã)</option>
              <option value="weekly">Semanal (Segundas)</option>
              <option value="instant">Instantâneo (quando houver novidade)</option>
            </select>
            <div className="flex space-x-3">
              <button
                onClick={configureEmailAlerts}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-sm text-gray-500">Sistema Avançado - Diário Oficial Municipal</p>
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
                    <p className="text-sm font-medium text-gray-600">Notificações Email</p>
                    <p className="text-lg font-bold text-gray-900">
                      {emailConfig.email ? 'Configurado' : 'Não configurado'}
                    </p>
                  </div>
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Email Configuration Banner */}
            {!emailConfig.email && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Configure alertas por email</p>
                      <p className="text-sm text-purple-700">Receba relatórios diários no seu email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            )}

            {/* Alerts Management */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciar Alertas</h2>
                <div className="flex space-x-2">
                  {emailConfig.email && (
                    <button
                      onClick={sendReportByEmail}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm transition-colors flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar Relatório</span>
                    </button>
                  )}
                  <button
                    onClick={checkAlertsManually}
                    disabled={serverStatus !== 'online'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                  >
                    Verificar Agora
                  </button>
                </div>
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
                  <div className="flex items-center space-x-2">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="txt">Relatório TXT</option>
                      <option value="json">Dados JSON</option>
                    </select>
                    <button
                      onClick={() => exportResults(exportFormat)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Exportar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resultados ({searchResults.length})
                  </h2>
                  {emailConfig.email && (
                    <button
                      onClick={sendReportByEmail}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar por Email</span>
                    </button>
                  )}
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
                          {result.person && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Pessoa:</span> {result.person}
                            </p>
                          )}
                          {result.company && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Empresa:</span> {result.company}
                            </p>
                          )}
                          {result.value && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Valor:</span> {result.value}
                            </p>
                          )}
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
