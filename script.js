document.addEventListener('DOMContentLoaded', () => {
    // --- COMMON ELEMENTS ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const outputContent = document.getElementById('output-content');
    const svgPreview = document.getElementById('svgPreview');
    const clearBtn = document.getElementById('clearBtn');
    const notification = document.getElementById('notification');
    let notificationTimeout;

    // --- NEW: CUSTOM MESSAGE BOX FUNCTION ---
    /**
     * Displays a custom message box.
     * @param {object} options - The options for the message box.
     * @param {string} options.title - The title of the dialog.
     * @param {string} options.message - The message content.
     * @param {boolean} [options.isConfirm=false] - If true, displays OK and Cancel buttons.
     * @returns {Promise<boolean>} - A promise that resolves to `true` if OK is clicked, and `false` if Cancel is clicked or the dialog is dismissed.
     */
    function showMsgBox(options) {
        const { title, message, isConfirm = false } = options;

        return new Promise(resolve => {
            // Remove any existing message box first
            const existingBox = document.querySelector('.msgbox-overlay');
            if (existingBox) {
                existingBox.remove();
            }

            // --- Create Elements ---
            const overlay = document.createElement('div');
            overlay.className = 'msgbox-overlay';

            const container = document.createElement('div');
            container.className = 'msgbox-container';

            const header = document.createElement('div');
            header.className = 'msgbox-header';

            const titleEl = document.createElement('h3');
            titleEl.className = 'msgbox-title';
            titleEl.textContent = title;

            const body = document.createElement('div');
            body.className = 'msgbox-body';
            body.textContent = message;

            const footer = document.createElement('div');
            footer.className = 'msgbox-footer';

            const okBtn = document.createElement('button');
            okBtn.className = 'msgbox-btn primary';
            okBtn.textContent = 'OK';

            // --- Assemble Elements ---
            header.appendChild(titleEl);
            footer.appendChild(okBtn);

            if (isConfirm) {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'msgbox-btn secondary';
                cancelBtn.textContent = 'Cancel';
                footer.prepend(cancelBtn); // Add cancel button before OK

                cancelBtn.addEventListener('click', () => close(false));
            }

            container.appendChild(header);
            container.appendChild(body);
            container.appendChild(footer);
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            // --- Show Logic ---
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);
            
            // --- Event Handlers ---
            const close = (value) => {
                overlay.classList.remove('show');
                overlay.addEventListener('transitionend', () => {
                    overlay.remove();
                    resolve(value);
                }, { once: true });
            };

            okBtn.addEventListener('click', () => close(true));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    close(false);
                }
            });
        });
    }

    // --- COMMON LOGIC ---

    // 1. Theme Toggler
    const updateThemeIcons = (isDark) => {
        if (themeToggleDarkIcon && themeToggleLightIcon) {
            themeToggleDarkIcon.classList.toggle('hidden', !isDark);
            themeToggleLightIcon.classList.toggle('hidden', isDark);
        }
    };

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcons(isDark);
        });
    }
    
    // Initialize theme on load
    updateThemeIcons(document.documentElement.classList.contains('dark'));

    // 2. Notification System
    const showNotification = (message, type = 'error') => {
        clearTimeout(notificationTimeout);
        notification.textContent = message;
        notification.className = 'notification'; // Reset classes
        notification.classList.add(type); // 'error' or 'success'
        notification.classList.add('show');
        
        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    };

    // 3. View Reset Logic
    const resetView = () => {
        outputPlaceholder.classList.remove('hidden');
        outputContent.classList.add('hidden');
        svgPreview.innerHTML = '';
        if (fileInput) fileInput.value = '';
        
        // Page-specific resets
        const svgCode = document.getElementById('svgCode');
        if (svgCode) svgCode.value = '';

        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.dataset.svgContent = '';
    };
    
    // 4. Drag and Drop Listeners
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            // Determine which processor to use based on page
            if (document.getElementById('svgCode')) {
                processSvgFile(file);
            } else {
                processImageFile(file);
            }
        });
    }
    
    // Attach common clear button listener (MODIFIED TO USE MSGBOX)
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (!outputPlaceholder.classList.contains('hidden')) {
                return; // Nothing to clear
            }
            
            const confirmed = await showMsgBox({
                title: 'Confirm Clear',
                message: 'Are you sure you want to clear the current SVG?',
                isConfirm: true
            });

            if (confirmed) {
                // The correct reset function will be called based on the page-specific override below
                window.resetView ? window.resetView() : resetView();
            }
        });
    }

    // --- PAGE-SPECIFIC LOGIC ---

    // Check if it's the SVG-to-Code page
    const svgCodeEl = document.getElementById('svgCode');
    const copyBtn = document.getElementById('copyBtn');

    if (svgCodeEl && copyBtn) {
        const processSvgFile = (file) => {
            if (!file) return;

            if (file.type !== 'image/svg+xml') {
                showNotification('Invalid file type. Please upload an SVG.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const svgContent = e.target.result;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(svgContent, "image/svg+xml");
                    if (doc.querySelector('parsererror')) {
                        throw new Error('Malformed SVG file.');
                    }

                    svgPreview.innerHTML = svgContent;
                    svgCodeEl.value = svgContent;
                    
                    outputPlaceholder.classList.add('hidden');
                    outputContent.classList.remove('hidden');
                } catch (error) {
                    console.error("SVG Processing Error:", error);
                    showNotification(error.message || 'Could not process the SVG file.');
                    resetView();
                }
            };
            reader.onerror = () => {
                showNotification('Could not read the file.');
                resetView();
            };
            reader.readAsText(file);
        };

        if(fileInput) fileInput.addEventListener('change', (e) => processSvgFile(e.target.files[0]));
        
        copyBtn.addEventListener('click', () => {
            if (!svgCodeEl.value) return;
            navigator.clipboard.writeText(svgCodeEl.value).then(() => {
                // MODIFIED to use MsgBox instead of notification
                showMsgBox({
                    title: 'Success!',
                    message: 'The SVG code has been copied to your clipboard.'
                });
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy to clipboard.');
            });
        });
    }

    // Check if it's the Image-to-SVG page
    const downloadBtn = document.getElementById('downloadBtn');

    if (downloadBtn) {
        let currentSvgContent = '';
        
        const processImageFile = (file) => {
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showNotification('Invalid file type. Please upload a PNG or JPG.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const { width, height } = img;
                    currentSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="${e.target.result}" width="${width}" height="${height}"/>\n</svg>`;

                    svgPreview.innerHTML = currentSvgContent;
                    
                    outputPlaceholder.classList.add('hidden');
                    outputContent.classList.remove('hidden');
                };
                img.onerror = () => {
                    showNotification('Could not load the image file.');
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                showNotification('Could not read the file.');
                resetView();
            };
            reader.readAsDataURL(file);
        };

        if(fileInput) fileInput.addEventListener('change', (e) => processImageFile(e.target.files[0]));
        
        downloadBtn.addEventListener('click', () => {
            if (!currentSvgContent) {
                showNotification('There is no SVG to download.');
                return;
            }

            const blob = new Blob([currentSvgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        // Override reset view for this page
        const originalResetView = resetView;
        window.resetView = () => {
            originalResetView();
            currentSvgContent = '';
        };
        // The main clearBtn listener is already attached above.
        // This override ensures that when it's called on this page, the correct logic runs.
    }
});