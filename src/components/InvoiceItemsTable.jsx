import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const InvoiceItemsTable = ({ items, setItems, exchangeRate, currency, disabled = false }) => {
  const [inputValues, setInputValues] = useState({});
  const [descriptions, setDescriptions] = useState([]);
  
  // Fetch service descriptions from Supabase on mount
  useEffect(() => {
    const fetchDescriptions = async () => {
      let { data, error } = await supabase.from('descriptions').select('*').order('id', { ascending: true });
      if (!error && data) {
        setDescriptions(data);
      }
    };
    fetchDescriptions();
    // Listen for updates to descriptions (in case another tab/page updates)
    const handleDescriptionsUpdated = () => {
      fetchDescriptions();
    };
    window.addEventListener('descriptionsUpdated', handleDescriptionsUpdated);
    return () => {
      window.removeEventListener('descriptionsUpdated', handleDescriptionsUpdated);
    };
  }, []);
  
  // Ensure all items have the correct structure and subServices are properly initialized
  useEffect(() => {
    if (items && items.length > 0) {
      console.log('Processing items in InvoiceItemsTable:', items);
      const updatedItems = items.map(item => {
        // Deep clone the item to avoid reference issues
        const clonedItem = {
          ...item,
          // Ensure type property is set
          type: item.type || 'main',
          // Ensure subServices is properly initialized
          subServices: Array.isArray(item.subServices) 
            ? item.subServices.map(subService => ({
                id: subService.id || `subservice-${Math.random().toString(36).substr(2, 9)}`,
                name: subService.name || '',
                description: subService.description || '',
                amountUSD: parseFloat(subService.amountUSD) || 0,
                amountINR: parseFloat(subService.amountINR) || 0
              }))
            : []
        };
        
        // Handle legacy data format - convert nestedRows to subServices if needed
        if (Array.isArray(item.nestedRows) && item.nestedRows.length > 0) {
          console.log('Converting nestedRows to subServices for item:', item.name);
          clonedItem.subServices = item.nestedRows.map(row => ({
            id: row.id || `subservice-${Math.random().toString(36).substr(2, 9)}`,
            name: row.name || '',
            description: row.description || '',
            amountUSD: parseFloat(row.amountUSD) || 0,
            amountINR: parseFloat(row.amountINR) || 0
          }));
        }
        
        return clonedItem;
      });
      
      // Only update if there were changes to avoid infinite loops
      const needsUpdate = JSON.stringify(updatedItems) !== JSON.stringify(items);
      if (needsUpdate) {
        console.log('Updating invoice items structure with processed items');
        // Using a setTimeout to avoid potential race conditions with other state updates
        setTimeout(() => {
          setItems(updatedItems);
        }, 0);
      }
    }
  // We're adding a unique JSON representation of items as a dependency instead of items itself
  // This prevents unnecessary re-renders but still catches actual data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), setItems]);

  // Add a new empty main service to the list
  const addMainService = () => {
    if (disabled) return; // Don't allow changes if disabled
    
    setItems([
      ...items,
      {
        id: `main-${Math.random().toString(36).substr(2, 9)}`,
        type: 'main',
        name: '',
        description: '',
        subServices: []
      }
    ]);
  };

  // Add a new sub-service to a main service
  const addSubService = (mainIndex) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const updatedItems = [...items];
    // Ensure subServices exists before trying to push to it
    if (!updatedItems[mainIndex].subServices) {
      updatedItems[mainIndex].subServices = [];
    }
    updatedItems[mainIndex].subServices.push({
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      description: '',
      amountUSD: 0,
      amountINR: 0
    });
    setItems(updatedItems);
  };

  // Remove a main service at the specified index
  const removeMainService = (index) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  // Remove a sub-service from a main service
  const removeSubService = (mainIndex, subIndex) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const updatedItems = [...items];
    // Ensure subServices exists before trying to splice it
    if (updatedItems[mainIndex].subServices) {
      updatedItems[mainIndex].subServices.splice(subIndex, 1);
      setItems(updatedItems);
      
      // Clean up inputValues for the removed item
      const newInputValues = { ...inputValues };
      delete newInputValues[`${mainIndex}-${subIndex}-amountUSD`];
      delete newInputValues[`${mainIndex}-${subIndex}-amountINR`];
      setInputValues(newInputValues);
    }
  };

  // Handle focus on amount input fields
  const handleAmountFocus = (mainIndex, subIndex, field) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const key = `${mainIndex}-${subIndex}-${field}`;
    // Ensure the field exists before trying to access it
    if (items[mainIndex]?.subServices?.[subIndex]?.[field] !== undefined) {
      setInputValues({
        ...inputValues,
        [key]: items[mainIndex].subServices[subIndex][field].toString()
      });
    }
  };

  // Handle blur on amount input fields
  const handleAmountBlur = (mainIndex, subIndex, field) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const key = `${mainIndex}-${subIndex}-${field}`;
    const value = inputValues[key] || '0';
    handleSubServiceChange(mainIndex, subIndex, field, value);
    
    const newInputValues = { ...inputValues };
    delete newInputValues[key];
    setInputValues(newInputValues);
  };

  // Handle change in amount input fields during typing
  const handleAmountInputChange = (mainIndex, subIndex, field, value) => {
    if (disabled) return; // Don't allow changes if disabled
    
    setInputValues({
      ...inputValues,
      [`${mainIndex}-${subIndex}-${field}`]: value
    });
  };

  // Handle change of main service name
  const handleMainServiceChange = (index, value) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const updatedItems = [...items];
    updatedItems[index].name = value;
    setItems(updatedItems);
  };

  // Handle change of sub-service fields
  const handleSubServiceChange = (mainIndex, subIndex, field, value) => {
    if (disabled) return; // Don't allow changes if disabled
    
    const updatedItems = [...items];
    
    // Ensure subServices exists
    if (!updatedItems[mainIndex].subServices) {
      updatedItems[mainIndex].subServices = [];
    }
    
    // Ensure the subService at subIndex exists
    if (!updatedItems[mainIndex].subServices[subIndex]) {
      updatedItems[mainIndex].subServices[subIndex] = {
        name: '',
        description: '',
        amountUSD: 0,
        amountINR: 0
      };
    }
    
    if (field === 'name' || field === 'description') {
      updatedItems[mainIndex].subServices[subIndex][field] = value;
    } else {
      const numericValue = parseFloat(value) || 0;
      updatedItems[mainIndex].subServices[subIndex][field] = numericValue;

      // Calculate the other currency equivalent
      if (field === 'amountUSD') {
        updatedItems[mainIndex].subServices[subIndex].amountINR = numericValue * exchangeRate;
      } else if (field === 'amountINR') {
        updatedItems[mainIndex].subServices[subIndex].amountUSD = numericValue / exchangeRate;
      }
    }

    // Force a deep copy to ensure React recognizes the change
    const itemsCopy = JSON.parse(JSON.stringify(updatedItems));
    setItems(itemsCopy);
  };

  // Get the display value for an amount field
  const getAmountDisplayValue = (mainIndex, subIndex, field) => {
    const key = `${mainIndex}-${subIndex}-${field}`;
    if (key in inputValues) {
      return inputValues[key];
    } else {
      // Check if the field exists before trying to access it
      return items[mainIndex]?.subServices?.[subIndex]?.[field]?.toFixed(2) || '0.00';
    }
  };

  return (
    <div className="service-items-table">
      <table>
        <thead>
          <tr>
            <th style={{ width: '70%' }}>Description</th>
            <th style={{ width: '15%' }}>Amount (USD)</th>
            <th style={{ width: '15%' }}>Amount (INR)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((mainService, mainIndex) => (
            <React.Fragment key={`main-${mainIndex}`}>
              {/* Main Service Row */}
              <tr className="main-service-row">
                <td colSpan="3">
                  <div style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      className="main-service-name"
                      value={mainService.name || ''}
                      onChange={(e) => handleMainServiceChange(mainIndex, e.target.value)}
                      placeholder="Main Service Name"
                      disabled={disabled}
                      style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold',
                        width: '100%',
                        border: 'none',
                        padding: '10px 0'
                      }}
                    />
                  </div>
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() => removeMainService(mainIndex)}
                    title="Remove main service"
                    disabled={disabled}
                    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                  >
                    ❌
                  </button>
                </td>
              </tr>
              
              {/* Sub-Services Rows */}
              {(mainService.subServices || []).map((subService, subIndex) => (
                <tr key={`sub-${mainIndex}-${subIndex}`} className="sub-service-row">
                  <td>
                    <div className="description-field" style={{ paddingLeft: '20px' }}>
                      <input
                        type="text"
                        className="item-name"
                        value={subService.name || ''}
                        onChange={(e) => handleSubServiceChange(mainIndex, subIndex, 'name', e.target.value)}
                        placeholder="Service name"
                        disabled={disabled}
                      />
                      {descriptions.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSubServiceChange(mainIndex, subIndex, 'name', e.target.value);
                            }
                          }}
                          disabled={disabled}
                          style={{ 
                            fontSize: '0.9rem',
                            padding: '6px',
                            marginTop: '6px',
                            marginBottom: '6px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--card-bg)',
                            width: '100%'
                          }}
                        >
                          <option value="">Select from the descriptions</option>
                          {descriptions.map(description => (
                            <option key={description.id} value={description.text}>
                              {description.text}
                            </option>
                          ))}
                        </select>
                      )}
                      <textarea
                        className="item-description"
                        value={subService.description || ''}
                        onChange={(e) => handleSubServiceChange(mainIndex, subIndex, 'description', e.target.value)}
                        placeholder="Service description"
                        disabled={disabled}
                      ></textarea>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="item-total-usd"
                      value={getAmountDisplayValue(mainIndex, subIndex, 'amountUSD')}
                      onChange={(e) => handleAmountInputChange(mainIndex, subIndex, 'amountUSD', e.target.value)}
                      onFocus={() => handleAmountFocus(mainIndex, subIndex, 'amountUSD')}
                      onBlur={() => handleAmountBlur(mainIndex, subIndex, 'amountUSD')}
                      placeholder="Amount (USD)"
                      disabled={disabled || currency === 'INR'}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="item-total-inr"
                      value={getAmountDisplayValue(mainIndex, subIndex, 'amountINR')}
                      onChange={(e) => handleAmountInputChange(mainIndex, subIndex, 'amountINR', e.target.value)}
                      onFocus={() => handleAmountFocus(mainIndex, subIndex, 'amountINR')}
                      onBlur={() => handleAmountBlur(mainIndex, subIndex, 'amountINR')}
                      placeholder="Amount (INR)"
                      disabled={disabled || currency === 'USD'}
                    />
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => removeSubService(mainIndex, subIndex)}
                      title="Remove sub-service"
                      disabled={disabled}
                      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Add Sub-Service Button */}
              <tr className="add-sub-service-row">
                <td colSpan="4" style={{ textAlign: 'left', paddingLeft: '30px' }}>
                  <button 
                    onClick={() => addSubService(mainIndex)} 
                    className="btn btn-sm btn-light add-sub-item-btn"
                    style={{ fontSize: '0.85rem', opacity: disabled ? 0.5 : 1 }}
                    disabled={disabled}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    Add Sub-Service
                  </button>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      <div className="table-actions">
        <button 
          onClick={addMainService} 
          className="btn btn-secondary add-item-btn"
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Main Service
        </button>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;