import { useState, useCallback } from 'react';
import validationUtils from '../utils/validationUtils';

/**
 * Custom hook for form handling
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Optional custom validation function
 * @returns {Object} Form handling methods and state
 */
export const useForm = (initialValues = {}, validateFn = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   * @param {Event|String} eventOrName - Event object or field name
   * @param {*} valueIfName - Value if name is provided directly
   */
  const handleChange = useCallback((eventOrName, valueIfName) => {
    let name, value;
    
    if (typeof eventOrName === 'string') {
      name = eventOrName;
      value = valueIfName;
    } else {
      const target = eventOrName.target;
      name = target.name;
      value = target.type === 'checkbox' ? target.checked : target.value;
    }
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
  }, []);

  /**
   * Handle input blur
   * @param {Event} e - Blur event
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    // Validate field on blur
    if (validateFn) {
      const validationResult = validateFn({ [name]: values[name] });
      if (validationResult.errors && validationResult.errors[name]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: validationResult.errors[name]
        }));
      } else {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [values, validateFn]);

  /**
   * Handle form submission
   * @param {Function} onSubmit - Submit callback
   * @returns {Function} - Form submission handler
   */
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      let validationResult = { isValid: true, errors: {} };
      
      if (validateFn) {
        validationResult = validateFn(values);
      } else {
        // Use default invoice validation if no custom validation provided
        validationResult = validationUtils.validateInvoiceForm(values);
      }
      
      setErrors(validationResult.errors);
      
      if (validationResult.isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
          setErrors(prev => ({ ...prev, form: error.message }));
        }
      }
      
      setIsSubmitting(false);
    };
  }, [values, validateFn]);

  /**
   * Reset form to initial or new values
   * @param {Object} newValues - Optional new values
   */
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set form values
   * @param {Object|Function} newValues - New values or updater function
   */
  const setFormValues = useCallback((newValues) => {
    if (typeof newValues === 'function') {
      setValues(prevValues => newValues(prevValues));
    } else {
      setValues(newValues);
    }
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues: setFormValues
  };
};

export default useForm;