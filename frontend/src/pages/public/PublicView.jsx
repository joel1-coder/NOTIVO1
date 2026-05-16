import React from 'react'
import { useParams } from 'react-router-dom'

const PublicView = () => {
  const { id } = useParams()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        borderRadius: '1rem',
        backgroundColor: '#1e293b',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Public Access</h1>
        <p style={{ color: '#94a3b8' }}>You have scanned a QR code and reached this page without logging in.</p>
        
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '2px dashed #334155',
          borderRadius: '0.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Resource ID:</p>
          <code style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{id || 'No ID provided'}</code>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => alert('Interaction without login!')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            Check Status
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublicView
