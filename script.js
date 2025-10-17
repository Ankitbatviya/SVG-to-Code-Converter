// --- DOM ELEMENT SELECTION ---
// Select all necessary HTML elements at the start for efficiency and clarity.
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const svgPreview = document.getElementById('svgPreview');
const svgCode = document.getElementById('svgCode');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const uploadView = document.getElementById('uploadView');
const previewContainer = document.getElementById('previewContainer');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleButton = document.getElementById('theme-toggle');

// --- THEME SWITCHER LOGIC ---
/**
 * Updates the visibility of the sun and moon icons based on the current theme.
 */
const updateThemeIcons = () => {
  if (document.documentElement.classList.contains('dark')) {
    // If dark mode is active, show the light icon (sun) and hide the dark icon (moon).
    themeToggleLightIcon.classList.remove('hidden');
    themeToggleDarkIcon.classList.add('hidden');
  } else {
    // If light mode is active, show the dark icon and hide the light icon.
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }
};

// Set the initial state of the theme toggle icon when the page loads.
updateThemeIcons();

// Add a click event listener to the theme toggle button.
themeToggleButton.addEventListener('click', () => {
  // Toggle the 'dark' class on the root <html> element.
  document.documentElement.classList.toggle('dark');
  const isDarkMode = document.documentElement.classList.contains('dark');
  // Save the user's preference to localStorage.
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  // Update the icons to reflect the new theme.
  updateThemeIcons();
});

// --- MAIN APPLICATION LOGIC ---
/**
 * Processes the selected SVG file.
 * @param {File} file - The SVG file selected by the user.
 */
function handleFile(file) {
  // Check if a file was selected and if it's an SVG.
  if (file && file.type === 'image/svg+xml') {
    const reader = new FileReader();
    // This event fires when the file has been successfully read.
    reader.onload = (e) => {
      const svgContent = e.target.result;

      // Clear any previous SVG preview.
      svgPreview.innerHTML = '';
      // Create an <img> element for a safe and reliable preview.
      const img = document.createElement('img');
      // Use a data URI to display the SVG content. This is safer than injecting raw SVG.
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svgContent);
      svgPreview.appendChild(img);
      
      // Display the raw SVG code in the textarea.
      svgCode.value = svgContent;
      
      // Switch from the upload view to the preview view.
      uploadView.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    // Start reading the file as text.
    reader.readAsText(file);
  } else {
    // If the file is not a valid SVG, show a temporary error message.
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.textContent = 'Please select a valid SVG file.';
    Object.assign(alertBox.style, {
        position: 'fixed', top: '1.25rem', right: '1.25rem',
        backgroundColor: '#ef4444', color: 'white',
        padding: '0.75rem 1.25rem', borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        zIndex: '1000'
    });
    document.body.appendChild(alertBox);
    // The alert will automatically disappear after 3 seconds.
    setTimeout(() => alertBox.remove(), 3000);
  }
}

// --- EVENT LISTENERS ---

// Listen for file selection via the file input.
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Drag and Drop event listeners for the drop zone.
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // This is necessary to allow a drop.
  dropZone.style.borderColor = 'var(--purple)'; // Visual feedback
});
dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = ''; // Revert visual feedback
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '';
  if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
  }
});

// Copy Button functionality.
copyBtn.addEventListener('click', () => {
  svgCode.select(); // Select the text in the textarea.
  try {
    document.execCommand('copy'); // Use the older, more compatible copy command.
    
    // Provide visual feedback that the copy was successful.
    const originalText = copyBtn.querySelector('span').textContent;
    copyBtn.querySelector('span').textContent = 'Copied!';
    copyBtn.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />';
    
    // Revert the button text and icon after 2 seconds.
    setTimeout(() => {
      copyBtn.querySelector('span').textContent = originalText;
      copyBtn.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5A2.25 2.25 0 019 2.25h.084m7.5 0h.008v.008h-.008V3.888zm-7.5 0h.008v.008h-.008V3.888z" />';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

// Reset Button functionality.
resetBtn.addEventListener('click', () => {
    // Hide the preview and show the upload view again.
    uploadView.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    // Clear all the old data.
    fileInput.value = '';
    svgPreview.innerHTML = '';
    svgCode.value = '';
});
