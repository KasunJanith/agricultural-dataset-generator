import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [subdomain, setSubdomain] = useState('')
  const [subdomains, setSubdomains] = useState([])
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statistics, setStatistics] = useState([])
  const [selectedSubdomainFilter, setSelectedSubdomainFilter] = useState('')
  const [serverHealth, setServerHealth] = useState('checking')

  // Auto-detect API base URL
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api'
    : '/api';

  useEffect(() => {
    checkServerHealth()
    fetchSubdomains()
    fetchDatasets()
    fetchStatistics()
  }, [])

  const checkServerHealth = async () => {
    try {
      await axios.get(`${API_BASE}/health`)
      setServerHealth('healthy')
    } catch (err) {
      setServerHealth('unhealthy')
      setError('Backend server is not responding. Please try again later.')
    }
  }

  const fetchSubdomains = async () => {
    try {
      const response = await axios.get(`${API_BASE}/subdomains`)
      setSubdomains(response.data)
      if (response.data.length > 0) {
        setSubdomain(response.data[0])
      }
    } catch (err) {
      setError('Failed to load subdomains. Check if backend is running.')
    }
  }

  const fetchDatasets = async (subdomainFilter = '') => {
    try {
      const params = subdomainFilter ? { subdomain: subdomainFilter } : {}
      const response = await axios.get(`${API_BASE}/datasets`, { params })
      setDatasets(response.data)
    } catch (err) {
      setError('Failed to load datasets')
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/statistics`)
      setStatistics(response.data)
    } catch (err) {
      console.error('Failed to load statistics')
    }
  }

  const handleGenerate = async () => {
    if (serverHealth !== 'healthy') {
      setError('Server is not healthy. Please check backend connection.')
      return
    }    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post(`${API_BASE}/generate-batch`, {
        subdomain,
        count: 50
      })

      const successMessage = `✅ Successfully generated ${response.data.generated} new records!`
      const duplicateMessage = response.data.duplicates > 0 ? 
        ` ${response.data.duplicates} duplicates were skipped.` : ''
      
      setSuccess(successMessage + duplicateMessage)
      fetchDatasets(selectedSubdomainFilter)
      fetchStatistics()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate translations. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = selectedSubdomainFilter ? { subdomain: selectedSubdomainFilter } : {}
      const response = await axios.get(`${API_BASE}/export-csv`, {
        params,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = selectedSubdomainFilter ? 
        `agricultural_dataset_${selectedSubdomainFilter}.csv` : 
        'agricultural_dataset.csv'
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export CSV')
    }
  }

  const handleFilterChange = (filterSubdomain) => {
    setSelectedSubdomainFilter(filterSubdomain)
    fetchDatasets(filterSubdomain)
  }

  const getStatsForSubdomain = (subdomain, type) => {
    const stat = statistics.find(s => s.subdomain === subdomain && s.type === type)
    return stat ? stat.count : 0
  }

  const totalRecords = datasets.length
  const filteredSubdomain = selectedSubdomainFilter || 'All Subdomains'

  return (
    <div className="container">
      <div className="header">
        <h1>🌱 Agricultural Translation Dataset Generator</h1>
        <p>Automatically generate random Sinhala agricultural terms and sentences with English translations for machine learning</p>
        <div style={{ marginTop: '10px' }}>
          Server Status: <span className="health-status">{serverHealth}</span>
          <span style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
            Environment: {process.env.NODE_ENV || 'development'}
          </span>
        </div>
      </div>

      <div className="form-container">
        <div className="form-group">
          <label htmlFor="subdomain">Select Agricultural Subdomain:</label>
          <select
            id="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            disabled={loading}
          >
            {subdomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error">❌ {error}</div>}
        {success && <div className="success">{success}</div>}        <button 
          onClick={handleGenerate}
          className="generate-btn"
          disabled={loading || serverHealth !== 'healthy'}
        >
          {loading ? '🔄 Generating 50 Records...' : '🚀 Generate 50 Random Records'}
        </button>

        <div className="stats-info">
          <p><strong>📝 How it works:</strong> 
          <br/>• Select an agricultural subdomain and click "Generate 50 Random Records"
          <br/>• The system uses Gemini AI to generate random Sinhala words/sentences with translations
          <br/>• Automatically checks for duplicates and ensures unique content
          <br/>• Generates 1-3 Singlish variations (different ways to romanize) and 3 English translation variants per term
          <br/>• Data is saved in SQLite database and can be exported as CSV</p>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <button onClick={handleExportCSV} className="export-btn" disabled={datasets.length === 0}>
            📥 Export as CSV
          </button>
          <select 
            value={selectedSubdomainFilter} 
            onChange={(e) => handleFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Subdomains</option>
            {subdomains.map(domain => (
              <option key={domain} value={domain}>
                {domain.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="stats">
          📊 Total Records: <strong>{totalRecords}</strong> | 
          Showing: <strong>{filteredSubdomain.replace(/_/g, ' ').toUpperCase()}</strong>
        </div>
      </div>

      {statistics.length > 0 && (
        <div className="statistics">
          <h3>📈 Dataset Statistics</h3>
          <div className="stats-grid">
            {subdomains.map(domain => {
              const words = getStatsForSubdomain(domain, 'word')
              const sentences = getStatsForSubdomain(domain, 'sentence')
              const total = words + sentences
              return total > 0 ? (
                <div key={domain} className="stat-item">
                  <h4>{domain.replace(/_/g, ' ').toUpperCase()}</h4>
                  <div>Words: <span className="count">{words}</span></div>
                  <div>Sentences: <span className="count">{sentences}</span></div>
                  <div>Total: <span className="count">{total}</span></div>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}      <div className="dataset-table">
        {datasets.length === 0 ? (
          <div className="loading">
            <h3>No datasets generated yet! 🚀</h3>
            <p>Select a subdomain and click "Generate 50 Random Records" to start building your agricultural translation dataset.</p>
            <p>Each generation creates 50 new unique records with Sinhala text, 1-3 Singlish variations, and three English translation variants.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <strong>Showing {datasets.length} records</strong>
              {selectedSubdomainFilter && ` for ${selectedSubdomainFilter.replace(/_/g, ' ').toUpperCase()}`}
            </div>            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Sinhala</th>
                  <th>Singlish Variations</th>
                  <th>English Variants</th>
                  <th>Subdomain</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <tr key={dataset.id}>
                    <td>
                      <span className={`type-badge type-${dataset.type}`}>
                        {dataset.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Arial, sans-serif' }}>{dataset.sinhala}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dataset.singlish1 && <div>1. {dataset.singlish1}</div>}
                        {dataset.singlish2 && <div>2. {dataset.singlish2}</div>}
                        {dataset.singlish3 && <div>3. {dataset.singlish3}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dataset.variant1 && <div>1. {dataset.variant1}</div>}
                        {dataset.variant2 && <div>2. {dataset.variant2}</div>}
                        {dataset.variant3 && <div>3. {dataset.variant3}</div>}
                      </div>
                    </td>
                    <td>{dataset.subdomain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

export default App