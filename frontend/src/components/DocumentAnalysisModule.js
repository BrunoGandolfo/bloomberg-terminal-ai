import React, { useState, useRef } from 'react';

// Estilos necesarios para el módulo
const styles = {
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  }
};

// Módulo de Análisis de Documentos
function DocumentAnalysisModule() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setAnalyzing(true);

      // Simular análisis
      setTimeout(() => {
        setAnalysis({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          fileType: file.type || 'Desconocido',
          uploadDate: new Date().toLocaleString(),
          // Simulación de análisis de contenido
          extractedData: {
            revenue: '$14.5B',
            netIncome: '$3.2B',
            operatingMargin: '22%',
            debtToEquity: '0.45',
            currentRatio: '1.8',
            roe: '18.5%'
          },
          keyFindings: [
            'Ingresos crecieron 15% año contra año',
            'Márgenes operativos mejoraron 2 puntos porcentuales',
            'Flujo de caja libre aumentó 20%',
            'Deuda neta disminuyó en $500M'
          ],
          risks: [
            'Exposición a fluctuaciones de tipo de cambio',
            'Concentración de clientes en top 10',
            'Presión competitiva en segmento principal'
          ]
        });
        setAnalyzing(false);
      }, 2000);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>ANÁLISIS DE DOCUMENTOS CON IA</h2>

      {/* Upload Section */}
      <div style={styles.panel}>
        <h3>CARGAR DOCUMENTO</h3>
        <p style={{ marginBottom: '15px' }}>
          Sube cualquier documento financiero (PDF, TXT, Form 10-K, Estados Financieros) para análisis automático con IA
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.txt,.doc,.docx"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          style={styles.button}
        >
          SELECCIONAR ARCHIVO
        </button>

        {uploadedFile && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
            <div>Archivo: {uploadedFile.name}</div>
            <div>Tamaño: {(uploadedFile.size / 1024).toFixed(2)} KB</div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analyzing && (
        <div style={styles.panel}>
          <h3>ANALIZANDO DOCUMENTO...</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-spinner">Procesando con IA...</div>
          </div>
        </div>
      )}

      {analysis && !analyzing && (
        <>
          {/* Métricas Extraídas */}
          <div style={styles.panel}>
            <h3>MÉTRICAS FINANCIERAS CLAVE</h3>
            <div style={styles.grid}>
              {Object.entries(analysis.extractedData).map(([key, value]) => (
                <div key={key} style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>{key.toUpperCase()}</div>
                  <div style={{ fontSize: '18px', color: '#00FF00' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hallazgos Clave */}
          <div style={styles.grid}>
            <div style={styles.panel}>
              <h3>HALLAZGOS PRINCIPALES</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {analysis.keyFindings.map((finding, i) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#00FF00' }}>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.panel}>
              <h3>RIESGOS IDENTIFICADOS</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {analysis.risks.map((risk, i) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#FF8800' }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chat con el Documento */}
          <div style={styles.panel}>
            <h3>PREGUNTAS AL DOCUMENTO</h3>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Pregunta sobre el documento (ej: ¿Cuál es el margen operativo?)"
                style={{ ...styles.input, width: '70%' }}
              />
              <button style={{ ...styles.button, marginLeft: '10px' }}>PREGUNTAR</button>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
              <p><strong>Usuario:</strong> ¿Cuál es la estrategia de crecimiento?</p>
              <p><strong>IA:</strong> Según el documento, la estrategia de crecimiento se centra en tres pilares:
                1) Expansión geográfica en mercados emergentes, 2) Inversión en I+D para nuevos productos,
                y 3) Adquisiciones estratégicas en el sector tecnológico.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DocumentAnalysisModule; 