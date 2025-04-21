// Validar todos los formularios con clase 'needs-validation'
(function() {
    'use strict';
    window.addEventListener('load', function() {
      const forms = document.getElementsByClassName('needs-validation');
      
      Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
      });
    }, false);
  })();
  
  // Formatear teléfono automáticamente
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function(e) {
      const value = this.value.replace(/\D/g, '');
      let formatted = '';
      
      if (value.length > 0) formatted = value.substring(0, 3);
      if (value.length > 3) formatted += '-' + value.substring(3, 6);
      if (value.length > 6) formatted += '-' + value.substring(6, 10);
      
      this.value = formatted;
    });
  });