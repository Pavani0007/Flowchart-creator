        // Handle form submission for full signup
        document.getElementById('full-signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Here you would typically:
            // 1. Validate inputs
            // 2. Send data to your backend
            // 3. Handle the response
            
            // For this demo, we'll just redirect after a short delay
            setTimeout(() => {
                window.location.href = 'something.html';
            }, 1000);
            
            // Show success message (optional)
            alert('Account created successfully! Redirecting to the editor...');
        });
        
        // Simple navigation for header buttons
        document.getElementById('signup-btn').addEventListener('click', function() {
            document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('login-btn').addEventListener('click', function() {
            alert('Login functionality would be implemented here');
        });
        
        document.getElementById('full-signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Here you would typically:
            // 1. Validate inputs
            // 2. Send data to your backend
            // 3. Handle the response
            
            // For this demo, we'll just redirect after a short delay
            setTimeout(() => {
                window.location.href = 'something.html';
            }, 1000);
            
            // Show success message (optional)
            alert('Account created successfully! Redirecting to the editor...');
        });
        
        // Simple navigation for header buttons
        document.getElementById('signup-btn').addEventListener('click', function() {
            document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('full-signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            
            // In a real app, you would send this to your backend
            console.log('Signing up:', name, email);
            
            // Redirect to something.html
            window.location.href = 'something.html';
        });
    
