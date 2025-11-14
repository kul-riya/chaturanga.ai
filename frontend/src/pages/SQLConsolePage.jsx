import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetadata, runQuery, getSampleQueries } from '../services/api';
import backgroundImage from '../assets/ancient_bg.png';

export default function SQLConsolePage() {
  const navigate = useNavigate();
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [sampleQueries, setSampleQueries] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [queryExecuted, setQueryExecuted] = useState(false);

  useEffect(() => {
    loadMetadata();
    loadSampleQueries();
  }, []);

  const loadMetadata = async () => {
    setMetadataLoading(true);
    try {
      const response = await getMetadata();
      if (response.success) {
        setMetadata(response.metadata);
      }
    } catch (err) {
      console.error('Error loading metadata:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  const loadSampleQueries = async () => {
    try {
      const response = await getSampleQueries();
      if (response.success) {
        setSampleQueries(response.queries || []);
      }
    } catch (err) {
      console.error('Error loading sample queries:', err);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setQueryResults(null);
    setQueryExecuted(true);

    try {
      const response = await runQuery(sqlQuery);
      if (response.success) {
        setQueryResults(response);
      } else {
        setError(response.error || 'Query execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error executing query');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSampleQuery = async (query) => {
    setSqlQuery(query);
    setError(null);
    setQueryResults(null);
    setLoading(true);
    setQueryExecuted(true);

    try {
      const response = await runQuery(query);
      if (response.success) {
        setQueryResults(response);
      } else {
        setError(response.error || 'Query execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error executing query');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data) => {
    if (!data || data.length === 0) {
      return <div style={{ padding: '20px', color: '#ccc' }}>No results</div>;
    }

    const columns = Object.keys(data[0]);

    return (
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'rgba(245, 240, 225, 0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: 'rgba(13, 37, 63, 0.8)' }}>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    color: '#f5f0e1',
                    fontWeight: 'bold',
                    borderBottom: '2px solid #f5f0e1',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid rgba(245, 240, 225, 0.2)',
                  backgroundColor: idx % 2 === 0 ? 'rgba(245, 240, 225, 0.05)' : 'transparent',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: '10px 12px',
                      color: '#f5f0e1',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    }}
                  >
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#162447',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 14px',
          backgroundColor: 'rgba(13,37,63,0.8)',
          color: '#f5f0e1',
          border: '2px solid #f5f0e1',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        ← Back
      </button>

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '20px',
          paddingTop: '60px',
        }}
      >
        {/* Main Content */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SQL Input Section */}
          <div
            style={{
              backgroundColor: 'rgba(13, 37, 63, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <h2 style={{ color: '#f5f0e1', marginBottom: '15px' }}>SQL Console</h2>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #f5f0e1',
                backgroundColor: 'rgba(245, 240, 225, 0.1)',
                color: '#f5f0e1',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={handleRunQuery}
                disabled={loading || !sqlQuery.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#6c757d' : '#e94560',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                {loading ? 'Running...' : 'Run Query'}
              </button>
              <button
                onClick={() => {
                  setSqlQuery('');
                  setQueryResults(null);
                  setError(null);
                  setQueryExecuted(false);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(245, 240, 225, 0.2)',
                  color: '#f5f0e1',
                  border: '2px solid #f5f0e1',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(233, 69, 96, 0.2)',
                border: '2px solid #e94560',
                borderRadius: '8px',
                padding: '15px',
                color: '#ffcccc',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results Section */}
          {queryExecuted && !loading && !error && (
            <div
              style={{
                backgroundColor: 'rgba(13, 37, 63, 0.8)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <h3 style={{ color: '#f5f0e1', marginBottom: '15px' }}>
                Query Results
                {queryResults?.row_count !== undefined && (
                  <span style={{ marginLeft: '10px', fontSize: '14px', color: '#ccc' }}>
                    ({queryResults.row_count} rows)
                  </span>
                )}
                {queryResults?.affected_rows !== undefined && (
                  <span style={{ marginLeft: '10px', fontSize: '14px', color: '#ccc' }}>
                    ({queryResults.affected_rows} rows affected)
                  </span>
                )}
              </h3>
              {queryResults?.data ? (
                renderTable(queryResults.data)
              ) : (
                <div style={{ padding: '20px', color: '#ccc' }}>
                  {queryResults?.message || 'Query executed successfully'}
                </div>
              )}
            </div>
          )}

          {/* Sample Queries Section */}
          <div
            style={{
              backgroundColor: 'rgba(13, 37, 63, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ color: '#f5f0e1', marginBottom: '15px' }}>Predefined Analytics Queries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sampleQueries.map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleRunSampleQuery(query.query)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(245, 240, 225, 0.1)',
                    border: '2px solid #f5f0e1',
                    borderRadius: '8px',
                    color: '#f5f0e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(233, 69, 96, 0.3)';
                    e.target.style.borderColor = '#e94560';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(245, 240, 225, 0.1)';
                    e.target.style.borderColor = '#f5f0e1';
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{query.name}</div>
                  <div style={{ fontSize: '12px', color: '#ccc', fontStyle: 'italic' }}>
                    {query.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              backgroundColor: 'rgba(13, 37, 63, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              position: 'sticky',
              top: '80px',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#f5f0e1' }}>Database Metadata</h3>
              <button
                onClick={loadMetadata}
                disabled={metadataLoading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: metadataLoading ? '#6c757d' : 'rgba(233, 69, 96, 0.3)',
                  color: '#f5f0e1',
                  border: '1px solid #e94560',
                  borderRadius: '6px',
                  cursor: metadataLoading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {metadataLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {metadata ? (
              Object.entries(metadata).map(([tableName, tableInfo]) => (
                <div
                  key={tableName}
                  style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: 'rgba(245, 240, 225, 0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: '#f5f0e1', fontSize: '16px', fontWeight: 'bold' }}>
                      {tableName}
                    </h4>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>
                      {tableInfo.row_count} rows
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <strong>Columns:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      {tableInfo.columns.map((col) => (
                        <li key={col.name}>
                          <span style={{ color: '#f5f0e1' }}>{col.name}</span>
                          <span style={{ color: '#999', marginLeft: '8px' }}>
                            ({col.type})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>
                {metadataLoading ? 'Loading metadata...' : 'No metadata available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

