import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CompanyLogo from './CompanyLogo';

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
  },
  screenerSection: {
    marginBottom: '20px'
  },
  screenerTitle: {
    color: '#FF8800',
    marginBottom: '10px'
  },
  table: {
    borderCollapse: 'collapse',
    margin: '15px 0',
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #00ff00',
    fontFamily: 'Courier New, monospace'
  },
  th: {
    padding: '8px 12px',
    border: '1px solid #333',
    textAlign: 'left',
    color: '#00ff00',
    background: '#1a1a1a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '0.9em'
  },
  td: {
    padding: '8px 12px',
    border: '1px solid #333',
    textAlign: 'left',
    color: '#00ff00'
  }
};

// Módulo de Asistente IA
function AIAssistantModule() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asesor financiero con IA. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Estado para el efecto de escritura
  const [displayedText, setDisplayedText] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const typewriterTimerRef = useRef(null);

  // Cleanup del typewriter effect cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
      }
    };
  }, []);

  // Efecto de escritura tipo máquina
  const typewriterEffect = (text, callback) => {
    // Limpiar timer anterior si existe
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }
    
    let index = 0;
    setDisplayedText('');
    setIsWriting(true);
    
    typewriterTimerRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
        setIsWriting(false);
        if (callback) callback();
      }
    }, 15); // Velocidad de escritura (15ms por carácter)
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Agregar mensaje del usuario
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Detectar si es sobre portfolio
      const shouldIncludePortfolio = inputMessage.toLowerCase().includes('portfolio') || 
                                     inputMessage.toLowerCase().includes('portafolio') ||
                                     inputMessage.toLowerCase().includes('cartera') ||
                                     inputMessage.toLowerCase().includes('posicion');
      
      const data = await apiCall('/api/ai/analyze', 'POST', {
        question: inputMessage,
        includePortfolio: shouldIncludePortfolio,
        includeMarketData: shouldIncludePortfolio
      });
      
      if (data.success && data.responses) {
        // Usar SOLO Claude, fallback a GPT si falla, luego Gemini
        let aiResponse = '';
        if (data.responses.claude && !data.responses.claude.includes('Error:')) {
          aiResponse = data.responses.claude;
        } else if (data.responses.gpt4 && !data.responses.gpt4.includes('Error:')) {
          aiResponse = '⚠️ Claude no disponible, usando GPT-4:\n\n' + data.responses.gpt4;
        } else if (data.responses.gemini && !data.responses.gemini.includes('Error:')) {
          aiResponse = '⚠️ Claude y GPT-4 no disponibles, usando Gemini:\n\n' + data.responses.gemini;
        } else {
          aiResponse = '❌ Error: No se pudo obtener respuesta de ninguna IA. Por favor intenta de nuevo.';
        }
        
        // Agregar mensaje vacío que se llenará con el efecto
        const aiMessage = { role: 'assistant', content: '', fullContent: aiResponse };
        setMessages(prev => [...prev, aiMessage]);
        
        // Iniciar efecto de escritura
        typewriterEffect(aiResponse, () => {
          // Actualizar el mensaje completo cuando termine
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = aiResponse;
            return newMessages;
          });
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error de conexión. Verifica que el servidor esté corriendo.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderScreenerTable = (title, data) => (
    <div style={styles.screenerSection}>
      <h4 style={styles.screenerTitle}>{title}</h4>
      <table style={{...styles.table, width: '100%'}}>
        <thead>
          <tr>
            <th style={{...styles.th, width: '25px'}}></th>
            <th style={styles.th}>Símbolo</th>
            <th style={styles.th}>Precio</th>
            {/* ... (resto de la tabla) */}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td style={styles.td}><CompanyLogo symbol={item.symbol} size={20} /></td>
              <td style={styles.td}>{item.symbol}</td>
              <td style={styles.td}>${item.price?.toFixed(2)}</td>
              {/* ... (resto de la tabla) */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <style>{`
        .markdown-content-bloomberg table {
          border-collapse: collapse;
          margin: 15px 0;
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #00ff00;
          font-family: 'Courier New', monospace;
        }
        
        .markdown-content-bloomberg th, 
        .markdown-content-bloomberg td {
          padding: 8px 12px;
          border: 1px solid #333;
          text-align: left;
          color: #00ff00;
        }
        
        .markdown-content-bloomberg th {
          background: #1a1a1a;
          color: #ff8800;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 0.9em;
        }
        
        .markdown-content-bloomberg tr:hover {
          background: #0f0f0f;
        }
        
        .markdown-content-bloomberg tr:nth-child(even) {
          background: #0f0f0f;
        }
        
        .markdown-content-bloomberg p {
          margin: 10px 0;
          line-height: 1.6;
        }
        
        .markdown-content-bloomberg strong {
          color: #ff8800;
        }
        
        .markdown-content-bloomberg a {
          color: #00ff00;
          text-decoration: underline;
        }
        
        .markdown-content-bloomberg a:hover {
          color: #ff8800;
        }
      `}</style>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>ASISTENTE IA FINANCIERO</h2>

      <div style={styles.panel}>
        <div style={{ height: '500px', overflowY: 'auto', marginBottom: '15px', paddingRight: '10px' }}>
          {messages.map((message, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: message.role === 'user' ? '#1a1a1a' : '#0a0a0a',
              borderRadius: '4px',
              border: message.role === 'user' ? '1px solid #333' : '1px solid #FF8800'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '5px', 
                color: message.role === 'user' ? '#FF8800' : '#00FF00' 
              }}>
                {message.role === 'user' ? '👤 TÚ' : '🤖 CLAUDE'}
              </div>
              <div style={{ lineHeight: '1.6' }}>
                {index === messages.length - 1 && message.role === 'assistant' && isWriting ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {displayedText + '▊'}
                  </div>
                ) : (
                  <>
                    <div className="markdown-content-bloomberg">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Mantener el estilo Bloomberg para código inline
                          code: ({node, inline, ...props}) => 
                            inline ? <code style={{color: '#00ff00', backgroundColor: '#1a1a1a', padding: '2px 4px'}} {...props} /> : <code {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {isTyping && !isWriting && (
            <div style={{ padding: '10px', color: '#FF8800', fontStyle: 'italic' }}>
              Claude está analizando...
            </div>
          )}
        </div>

        <div style={{ display: 'flex' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu pregunta..."
            style={{ ...styles.input, flex: 1 }}
            disabled={isTyping}
          />
          <button onClick={handleSendMessage} style={{ ...styles.button, marginLeft: '10px' }} disabled={isTyping}>
            {isTyping ? 'ANALIZANDO...' : 'ENVIAR'}
          </button>
        </div>
      </div>

      {/* Sugerencias */}
      <div style={styles.panel}>
        <h3>PREGUNTAS SUGERIDAS</h3>
        <div style={styles.grid}>
          <button onClick={() => setInputMessage('Analiza mi portfolio y dame recomendaciones específicas.')} style={{ ...styles.button, width: '100%' }}>
            Analizar mi portfolio
          </button>
          <button onClick={() => setInputMessage('¿Cuál es la perspectiva para el S&P 500 este trimestre?')} style={{ ...styles.button, width: '100%' }}>
            Perspectiva del S&P 500
          </button>
          <button onClick={() => setInputMessage('Dame 3 ETFs para invertir en mercados emergentes.')} style={{ ...styles.button, width: '100%' }}>
            ETFs de mercados emergentes
          </button>
          <button onClick={() => setInputMessage('Compara el riesgo entre invertir en Apple (AAPL) y Microsoft (MSFT).')} style={{ ...styles.button, width: '100%' }}>
            Comparar riesgo AAPL vs MSFT
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistantModule; 