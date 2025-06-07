// Debug script to help identify button click issues
console.log('🔍 Debug script loaded');

// Override console.log to show in page
const originalLog = console.log;
const debugOutput = document.createElement('div');
debugOutput.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: black;
    color: lime;
    font-family: monospace;
    font-size: 11px;
    padding: 10px;
    border: 2px solid lime;
    z-index: 10000;
`;
document.body.appendChild(debugOutput);

console.log = function(...args) {
    originalLog.apply(console, args);
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    debugOutput.innerHTML += message + '<br>';
    debugOutput.scrollTop = debugOutput.scrollHeight;
};

// Log button clicks
document.addEventListener('click', function(e) {
    console.log('🖱️ Click on:', e.target.tagName, e.target.className, e.target.textContent?.slice(0, 20));
    
    if (e.target.matches('.edit-btn')) {
        console.log('✏️ Edit button clicked!');
    }
    
    if (e.target.matches('.delete-btn')) {
        console.log('🗑️ Delete button clicked!');
    }
}, true);

console.log('🚀 Debug ready - click some buttons!');
