import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DebugPage = () => {
  const [serverInfo, setServerInfo] = useState('');
  const [testResults, setTestResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get server info on component mount
    getServerInfo();
    // Auto-run tests
    setTimeout(runTests, 500);
  }, []);

  const getServerInfo = () => {
    const info = `
      <p>URL: ${window.location.href}</p>
      <p>User Agent: ${navigator.userAgent}</p>
      <p>Page loaded at: ${new Date().toString()}</p>
    `;
    setServerInfo(info);
  };

  const runTests = () => {
    setIsLoading(true);
    setTestResults('<p>Running tests...</p>');
    
    const results = [];
    
    // Test 1: Basic JavaScript Execution
    try {
      results.push({
        name: 'JavaScript Execution',
        result: true,
        message: 'JavaScript is running properly'
      });
    } catch (e) {
      results.push({
        name: 'JavaScript Execution',
        result: false,
        message: 'JavaScript error: ' + e.message
      });
    }
    
    // Test 2: Window Objects
    try {
      if (window && document) {
        results.push({
          name: 'Window Objects',
          result: true,
          message: 'Window and Document objects accessible'
        });
      } else {
        results.push({
          name: 'Window Objects',
          result: false,
          message: 'Window or Document object missing'
        });
      }
    } catch (e) {
      results.push({
        name: 'Window Objects',
        result: false,
        message: 'Window Objects error: ' + e.message
      });
    }
    
    // Test 3: LocalStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.push({
        name: 'LocalStorage',
        result: true,
        message: 'LocalStorage is working'
      });
    } catch (e) {
      results.push({
        name: 'LocalStorage',
        result: false,
        message: 'LocalStorage error: ' + e.message
      });
    }
    
    // Test 4: Fetch API
    setTimeout(() => {
      try {
        fetch(window.location.href)
          .then(response => {
            results.push({
              name: 'Fetch API',
              result: true,
              message: 'Fetch API is working'
            });
            displayResults(results);
          })
          .catch(error => {
            results.push({
              name: 'Fetch API',
              result: false,
              message: 'Fetch API error: ' + error.message
            });
            displayResults(results);
          });
      } catch (e) {
        results.push({
          name: 'Fetch API',
          result: false,
          message: 'Fetch API error: ' + e.message
        });
        displayResults(results);
      }
    }, 500);
    
    // Test file access with key application files
    const filesToTest = [
      '/index.html',
      '/manifest.json'
    ];
    
    let completedTests = 0;
    const totalFileTests = filesToTest.length;
    
    filesToTest.forEach(url => {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            results.push({
              name: `File Access: ${url}`,
              result: true,
              message: `Successfully loaded ${url}`
            });
          } else {
            results.push({
              name: `File Access: ${url}`,
              result: false,
              message: `Failed to load ${url}: Status ${xhr.status}`
            });
          }
          
          completedTests++;
          if (completedTests === totalFileTests) {
            displayResults(results);
          }
        }
      };
      xhr.open('HEAD', url, true);
      xhr.send();
    });
  };

  const displayResults = (results) => {
    let html = '<ul>';
    
    results.forEach(test => {
      const resultClass = test.result ? 'success' : 'error';
      const resultIcon = test.result ? '✓' : '✗';
      
      html += `<li class="${resultClass}">
        <strong>${test.name}</strong>: ${resultIcon} ${test.message}
      </li>`;
    });
    html += '</ul>';
    
    // Add navigation links
    html += `<p>
      <a href="/">Go to Main App</a> | 
      <a href="/login">Go to Login</a> | 
      <a href="/diagnostic">Go to Diagnostics</a>
    </p>`;
    
    // Add auto-login link
    html += `<p>
      <a href="#" onClick="localStorage.setItem('isLoggedIn', 'true'); 
      localStorage.setItem('userEmail', 'user@example.com'); 
      alert('Auto-login set'); return false;">Set Auto-Login</a> | 
      <a href="#" onClick="localStorage.removeItem('isLoggedIn'); 
      localStorage.removeItem('userEmail'); 
      alert('Login cleared'); return false;">Clear Login</a>
    </p>`;
    
    setTestResults(html);
    setIsLoading(false);
  };

  return (
    <div className="debug-container">
      <h1>Server Deployment Debug Page</h1>
      <p>This page tests if the server is properly serving basic HTML and JavaScript.</p>
      
      <div className="card-nav">
        <Link to="/" className="btn btn-secondary">Go to Main App</Link>
        <Link to="/login" className="btn btn-secondary">Go to Login</Link>
        <Link to="/diagnostic" className="btn btn-secondary">Go to Diagnostics</Link>
        <Link to="/demo" className="btn btn-secondary">Go to Demo</Link>
      </div>
      
      <div className="card">
        <h2 className="card-title">Server Info</h2>
        <div dangerouslySetInnerHTML={{ __html: serverInfo }}></div>
      </div>
      
      <div className="card">
        <h2 className="card-title">Tests</h2>
        <div dangerouslySetInnerHTML={{ __html: testResults }}></div>
        <button id="run-tests" className="btn btn-secondary" onClick={runTests} disabled={isLoading}>
          {isLoading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>
    </div>
  );
};

export default DebugPage;