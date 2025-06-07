// Simple click test - add this temporarily to test button clicks
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug: DOM loaded, adding test event listeners');
    
    // Add click listeners to all buttons for debugging
    document.addEventListener('click', function(e) {
        if (e.target.matches('button')) {
            console.log('Debug: Button clicked:', e.target.className, e.target.textContent);
        }
        
        if (e.target.matches('.start-stop-btn')) {
            console.log('Debug: Start/Stop button clicked!');
        }
        
        if (e.target.matches('.complete-btn')) {
            console.log('Debug: Complete button clicked!');
        }
    });
});
