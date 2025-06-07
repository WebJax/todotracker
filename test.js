// Test Script for TimeTracker
console.log('=== TimeTracker Test Script ===');

// Test 1: Check if elements exist
console.log('1. Checking DOM elements...');
const taskList = document.getElementById('task-list');
const modal = document.getElementById('comment-modal');
const saveBtn = document.getElementById('modal-save-btn');
const cancelBtn = document.getElementById('modal-cancel-btn');

console.log('Task list:', taskList ? '✅' : '❌');
console.log('Modal:', modal ? '✅' : '❌');
console.log('Save button:', saveBtn ? '✅' : '❌');
console.log('Cancel button:', cancelBtn ? '✅' : '❌');

// Test 2: Check modal functionality
console.log('\n2. Testing modal...');
if (modal) {
    console.log('Modal classes:', modal.className);
    console.log('Modal display style:', window.getComputedStyle(modal).display);
}

// Test 3: Check task elements
console.log('\n3. Checking tasks...');
const tasks = document.querySelectorAll('.task');
console.log('Number of tasks:', tasks.length);

tasks.forEach((task, index) => {
    const id = task.dataset.id;
    const runningId = task.dataset.runningEntryId;
    const isRunning = task.classList.contains('running');
    const startStopBtn = task.querySelector('.start-stop-btn');
    const completeBtn = task.querySelector('.complete-btn');
    
    console.log(`Task ${index + 1}:`, {
        id,
        runningId,
        isRunning,
        hasStartStopBtn: !!startStopBtn,
        hasCompleteBtn: !!completeBtn
    });
});

// Test 4: Test event listeners
console.log('\n4. Event listeners should be attached to:');
console.log('- Task list for delegation');
console.log('- Add task form');
console.log('- Navigation buttons');

console.log('\n=== Test Complete ===');
