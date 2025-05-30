
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const canvas = document.getElementById('flowchart-canvas');
            const shapeOptions = document.querySelectorAll('.shape-option');
            const propertiesPanel = document.getElementById('properties-content');
            const saveJsonBtn = document.getElementById('save-json');
            const loadJsonBtn = document.getElementById('load-json');
            const exportImageBtn = document.getElementById('export-image');
            const clearCanvasBtn = document.getElementById('clear-canvas');
            const connectionModal = document.getElementById('connection-modal');
            const jsonModal = document.getElementById('json-modal');
            const statusMessage = document.getElementById('status-message');
            const templatesBtn = document.getElementById('templates-btn');
            const templatesModal = document.getElementById('templates-modal');
            const closeTemplatesBtn = document.getElementById('close-templates');
            const autoLayoutBtn = document.getElementById('auto-layout');
            const validateBtn = document.getElementById('validate-flowchart');
            const exportModal = document.getElementById('export-modal');
            const confirmExportBtn = document.getElementById('confirm-export');
            const cancelExportBtn = document.getElementById('cancel-export');
            const zoomInBtn = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const resetViewBtn = document.getElementById('reset-view');
            const shapeSearch = document.getElementById('shape-search');
            const helpBtn = document.getElementById('help-btn');
            const backgroundBtn = document.getElementById('background-btn');
            const backgroundModal = document.getElementById('background-modal');
            const closeBackgroundBtn = document.getElementById('close-background');
            const applyBackgroundBtn = document.getElementById('apply-background');
            const cancelBackgroundBtn = document.getElementById('cancel-background');
            const bgColorInput = document.getElementById('bg-color');
            const showGridCheckbox = document.getElementById('show-grid');
            const gridSizeInput = document.getElementById('grid-size');
            const gridColorInput = document.getElementById('grid-color');
            const snapToGridCheckbox = document.getElementById('snap-to-grid');
            const bgImageInput = document.getElementById('bg-image');
            const bgOpacityInput = document.getElementById('bg-opacity');
            const removeBgImageBtn = document.getElementById('remove-bg-image');


            let snapToGrid = false;
            let gridSize = 20;
            let selectedElement = null;
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;
            let connecting = false;
            let connectionStart = null;
            let tempConnection = null;
            let elements = [];
            let connections = [];
            let nextId = 1;
            let scale = 1;
            let panX = 0;
            let panY = 0;
            let copiedElement = null;
            let history = [];
            let currentHistoryIndex = -1;
            canvas.style.backgroundColor = '#ffffff';
            
            // Initialize the canvas
            initCanvas();
            
            // Event Listeners
            shapeOptions.forEach(option => {
                option.addEventListener('click', () => addShape(option.dataset.shape));
            });
            
            saveJsonBtn.addEventListener('click', showSaveJsonModal);
            loadJsonBtn.addEventListener('click', showLoadJsonModal);
            exportImageBtn.addEventListener('click', showExportModal);
            clearCanvasBtn.addEventListener('click', clearCanvas);
            templatesBtn.addEventListener('click', showTemplatesModal);
            closeTemplatesBtn.addEventListener('click', () => templatesModal.style.display = 'none');
            autoLayoutBtn.addEventListener('click', autoLayout);
            validateBtn.addEventListener('click', validateFlowchart);
            confirmExportBtn.addEventListener('click', handleExport);
            cancelExportBtn.addEventListener('click', () => exportModal.style.display = 'none');
            zoomInBtn.addEventListener('click', () => handleZoom(1));
            zoomOutBtn.addEventListener('click', () => handleZoom(-1));
            resetViewBtn.addEventListener('click', resetView);
            shapeSearch.addEventListener('input', handleShapeSearch);
            helpBtn.addEventListener('click', startTutorial);
            backgroundBtn.addEventListener('click', showBackgroundModal);
            closeBackgroundBtn.addEventListener('click', () => backgroundModal.style.display = 'none');
            applyBackgroundBtn.addEventListener('click', applyBackgroundSettings);
            cancelBackgroundBtn.addEventListener('click', () => backgroundModal.style.display = 'none');
            bgImageInput.addEventListener('change', handleBgImageUpload);
            removeBgImageBtn.addEventListener('click', removeBgImage);
            
            
            // Modal event listeners
            document.getElementById('cancel-connection').addEventListener('click', cancelConnection);
            document.getElementById('save-connection').addEventListener('click', saveConnection);
            document.getElementById('cancel-json').addEventListener('click', () => jsonModal.style.display = 'none');
            document.getElementById('confirm-json').addEventListener('click', handleJsonConfirm);
            
            // Keyboard shortcuts
            document.addEventListener('keydown', handleKeyboardShortcuts);
            
            // Initialize templates
            initTemplates();
            
            // Initialize the canvas with event listeners
            function initCanvas() {
                // Regular drag events
                canvas.addEventListener('mousedown', startDrag);
                document.addEventListener('mousemove', drag); // Changed to document
                document.addEventListener('mouseup', endDrag); // Changed to document
                
                // Middle mouse panning
                canvas.addEventListener('mousedown', (e) => {
                    if (e.button === 1) {
                        e.preventDefault();
                        isDragging = true;
                        dragOffsetX = e.clientX;
                        dragOffsetY = e.clientY;
                    }
                });
                
                // Save initial state
                saveState();
            }
            
            // Add a new shape to the canvas
            function addShape(shapeType, templateData = null) {
                const shape = document.createElement('div');
                const id = 'element-' + nextId++;
                const size = templateData ? 
                    { width: templateData.width || 100, height: templateData.height || 100 } :
                    shapeType === 'document' ? { width: 120, height: 80 } : 
                    shapeType === 'hexagon' ? { width: 100, height: 100 } : 
                    { width: 100, height: 100 };
                
                const x = canvas.scrollLeft + (canvas.clientWidth / 2) - (size.width / 2);
                const y = canvas.scrollTop + (canvas.clientHeight / 2) - (size.height / 2);
                
                shape.className = `flowchart-shape ${shapeType}`;
                shape.id = id;
                shape.style.width = `${size.width}px`;
                shape.style.height = `${size.height}px`;
                shape.style.left = `${x}px`;
                shape.style.top = `${y}px`;
                
                // Set colors based on template or default
                const defaultColors = {
                    rectangle: '#f1c40f',
                    circle: '#9b59b6',
                    diamond: '#1abc9c',
                    parallelogram: '#e67e22',
                    document: '#3498db',
                    hexagon: '#9b59b6'
                };
                
                const color = templateData?.color || defaultColors[shapeType];
                shape.style.backgroundColor = color;
                
                const text = document.createElement('div');
                text.className = 'shape-text editable';
                text.textContent = templateData?.text || shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
                text.style.color = getContrastColor(color);
                shape.appendChild(text);
                
                // Add connectors
                addConnectors(shape);
                
                canvas.appendChild(shape);
                
                // Add to elements array
                const element = {
                    id,
                    type: shapeType,
                    x,
                    y,
                    width: size.width,
                    height: size.height,
                    text: text.textContent,
                    color: color,
                    element: shape
                };
                
                elements.push(element);
                
                // Make text editable
                makeTextEditable(text, element);
                
                // Select the new shape
                selectElement(shape, element);
                
                showStatusMessage(`Added new ${shapeType}`);
                
                // Save state
                saveState();
                
                return element;
            }
            
            // Add connectors to a shape
            function addConnectors(shape) {
                const positions = [
                    { side: 'top', x: '50%', y: '0%' },
                    { side: 'right', x: '100%', y: '50%' },
                    { side: 'bottom', x: '50%', y: '100%' },
                    { side: 'left', x: '0%', y: '50%' }
                ];
                
                positions.forEach(pos => {
                    const connector = document.createElement('div');
                    connector.className = 'connector';
                    connector.dataset.side = pos.side;
                    connector.dataset.parent = shape.id;
                    connector.style.left = pos.x;
                    connector.style.top = pos.y;
                    connector.style.transform = 'translate(-50%, -50%)';
                    
                    connector.addEventListener('mousedown', startConnection);
                    shape.appendChild(connector);
                });
            }
            
            // Make shape text editable
            function makeTextEditable(textElement, elementData) {
                textElement.addEventListener('dblclick', () => {
                    const input = document.createElement('textarea');
                    input.className = 'shape-text-input';
                    input.value = textElement.textContent;
                    input.style.color = getContrastColor(elementData.color);
                    
                    textElement.textContent = '';
                    textElement.appendChild(input);
                    input.focus();
                    
                    function saveText() {
                        const newText = input.value.trim();
                        textElement.textContent = newText || elementData.type;
                        elementData.text = newText || elementData.type;
                        updatePropertiesPanel();
                        saveState();
                    }
                    
                    input.addEventListener('blur', saveText);
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveText();
                        }
                    });
                });
            }
            
            function getContrastColor(hexColor) {
                // Convert hex to RGB
                const r = parseInt(hexColor.substr(1, 2), 16);
                const g = parseInt(hexColor.substr(3, 2), 16);
                const b = parseInt(hexColor.substr(5, 2), 16);
                
                // Calculate luminance
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                
                // Return black or white depending on background brightness
                return luminance > 0.5 ? '#000000' : '#ffffff';
            }
            
            // Start dragging an element
            function startDrag(e) {
                // Middle mouse button panning
                if (e.button === 1) {
                    isDragging = true;
                    dragOffsetX = e.clientX;
                    dragOffsetY = e.clientY;
                    return;
                }
            
                // Check if we're clicking a connector
                if (e.target.classList.contains('connector')) {
                    return;
                }
            
                // Find the shape element
                let target = e.target;
                while (target && !target.classList.contains('flowchart-shape') && target !== canvas) {
                    target = target.parentElement;
                }
            
                if (target && target !== canvas && target.classList.contains('flowchart-shape')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    isDragging = true;
                    selectedElement = target;
                    
                    // Get position relative to canvas
                    const canvasRect = canvas.getBoundingClientRect();
                    const shapeRect = target.getBoundingClientRect();
                    
                    dragOffsetX = e.clientX - shapeRect.left + canvas.scrollLeft;
                    dragOffsetY = e.clientY - shapeRect.top + canvas.scrollTop;
                    
                    // Bring to front
                    target.style.zIndex = '100';
                    
                    // Select the element
                    const elementData = elements.find(el => el.id === target.id);
                    selectElement(target, elementData);
                } else {
                    // Clicked on canvas background - deselect
                    if (selectedElement) {
                        selectedElement.classList.remove('selected');
                        selectedElement = null;
                        propertiesPanel.innerHTML = '<p>Select an element to edit its properties.</p>';
                    }
                }
            }
            
            // Drag an element or pan the canvas
            
            
            // Show alignment guides
            function showAlignmentGuides(currentElement) {
                // Remove existing guides
                document.querySelectorAll('.guide-line').forEach(el => el.remove());
                
                elements.forEach(el => {
                    if (el.id !== currentElement.id) {
                        // Check for horizontal alignment (center)
                        if (Math.abs(el.y + el.height/2 - (currentElement.y + currentElement.height/2)) < 10) {
                            drawGuideLine('horizontal', el.y + el.height/2);
                            // Snap to position
                            currentElement.y = el.y + (el.height - currentElement.height)/2;
                            selectedElement.style.top = `${currentElement.y}px`;
                        }
                        
                        // Check for vertical alignment (center)
                        if (Math.abs(el.x + el.width/2 - (currentElement.x + currentElement.width/2)) < 10) {
                            drawGuideLine('vertical', el.x + el.width/2);
                            // Snap to position
                            currentElement.x = el.x + (el.width - currentElement.width)/2;
                            selectedElement.style.left = `${currentElement.x}px`;
                        }
                        
                        // Check for top alignment
                        if (Math.abs(el.y - currentElement.y) < 10) {
                            drawGuideLine('horizontal', el.y);
                            currentElement.y = el.y;
                            selectedElement.style.top = `${currentElement.y}px`;
                        }
                        
                        // Check for bottom alignment
                        if (Math.abs((el.y + el.height) - (currentElement.y + currentElement.height)) < 10) {
                            drawGuideLine('horizontal', el.y + el.height);
                            currentElement.y = el.y + el.height - currentElement.height;
                            selectedElement.style.top = `${currentElement.y}px`;
                        }
                        
                        // Check for left alignment
                        if (Math.abs(el.x - currentElement.x) < 10) {
                            drawGuideLine('vertical', el.x);
                            currentElement.x = el.x;
                            selectedElement.style.left = `${currentElement.x}px`;
                        }
                        
                        // Check for right alignment
                        if (Math.abs((el.x + el.width) - (currentElement.x + currentElement.width)) < 10) {
                            drawGuideLine('vertical', el.x + el.width);
                            currentElement.x = el.x + el.width - currentElement.width;
                            selectedElement.style.left = `${currentElement.x}px`;
                        }
                    }
                });
            }
            
            function drawGuideLine(type, position) {
                const guide = document.createElement('div');
                guide.className = `guide-line ${type}`;
                if (type === 'horizontal') {
                    guide.style.top = `${position}px`;
                } else {
                    guide.style.left = `${position}px`;
                }
                canvas.appendChild(guide);
                setTimeout(() => guide.remove(), 500);
            }
            
            // End dragging
            function endDrag() {
                if (isDragging && selectedElement) {
                    isDragging = false;
                    
                    // Update element data
                    const elementData = elements.find(el => el.id === selectedElement.id);
                    if (elementData) {
                        elementData.x = parseInt(selectedElement.style.left);
                        elementData.y = parseInt(selectedElement.style.top);
                    }
                    
                    // Reset z-index
                    if (selectedElement) {
                        selectedElement.style.zIndex = '';
                    }
                    
                    // Save state
                    saveState();
                } else if (isDragging) {
                    isDragging = false;
                }
            }
            
            // Select an element
            function selectElement(element, elementData) {
                // Deselect previous
                if (selectedElement) {
                    selectedElement.classList.remove('selected');
                }
                
                selectedElement = element;
                selectedElement.classList.add('selected');
                
                // Update properties panel
                updatePropertiesPanel(elementData);
            }
            
            // Update properties panel
            function updatePropertiesPanel(elementData) {
                if (!elementData) {
                    propertiesPanel.innerHTML = '<p>Select an element to edit its properties.</p>';
                    return;
                }
            
                let html = `
                    <div class="property-group">
                        <label>Type:</label>
                        <input type="text" value="${elementData.type}" disabled>
                    </div>
                    <div class="property-group">
                        <label>Text:</label>
                        <textarea id="shape-text-input" style="height: 60px;">${elementData.text || ''}</textarea>
                    </div>
                    <div class="property-group">
                        <label>Position:</label>
                        <div style="display: flex; gap: 5px;">
                            <input type="number" id="shape-x-input" value="${elementData.x}" style="width: 50%;">
                            <input type="number" id="shape-y-input" value="${elementData.y}" style="width: 50%;">
                        </div>
                    </div>
                    <div class="property-group">
                        <label>Size:</label>
                        <div style="display: flex; gap: 5px;">
                            <input type="number" id="shape-width-input" value="${elementData.width}" min="20" style="width: 50%;">
                            <input type="number" id="shape-height-input" value="${elementData.height}" min="20" style="width: 50%;">
                        </div>
                    </div>
                    <div class="property-group">
                        <label>Color:</label>
                        <input type="color" id="shape-color-input" value="${elementData.color || getShapeColor(elementData.type)}">
                    </div>
                    <div class="property-group">
                        <label>Text Color:</label>
                        <input type="color" id="shape-text-color-input" value="${getContrastColor(elementData.color || getShapeColor(elementData.type))}">
                    </div>
                `;
            
                if (elementData.type === 'rectangle') {
                    const borderRadius = parseInt(selectedElement.style.borderRadius) || 4;
                    html += `
                        <div class="property-group">
                            <label>Border Radius:</label>
                            <input type="range" id="shape-radius-input" min="0" max="50" value="${borderRadius}">
                        </div>
                    `;
                }
            
                if (elementData.type === 'parallelogram') {
                    const skewMatch = selectedElement.style.transform.match(/skewX\(([-+]?\d+)deg\)/);
                    const skewValue = skewMatch ? parseInt(skewMatch[1]) : -20;
                    html += `
                        <div class="property-group">
                            <label>Skew Angle:</label>
                            <input type="range" id="shape-skew-input" min="-45" max="45" value="${skewValue}">
                        </div>
                    `;
                }
            
                html += `
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <button id="copy-element" class="action-button secondary" style="flex: 1;">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button id="paste-element" class="action-button secondary" style="flex: 1;" ${!copiedElement ? 'disabled' : ''}>
                            <i class="fas fa-paste"></i> Paste
                        </button>
                        <button id="delete-element" class="action-button delete" style="flex: 1;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
            
                propertiesPanel.innerHTML = html;
            
                // Add event listeners to property inputs
                document.getElementById('shape-text-input').addEventListener('change', (e) => {
                    elementData.text = e.target.value;
                    const textElement = selectedElement.querySelector('.shape-text');
                    if (textElement) textElement.textContent = e.target.value;
                    saveState();
                });
            
                document.getElementById('shape-color-input').addEventListener('input', (e) => {
                    elementData.color = e.target.value;
                    selectedElement.style.backgroundColor = e.target.value;
                    const textElement = selectedElement.querySelector('.shape-text');
                    if (textElement) {
                        textElement.style.color = getContrastColor(e.target.value);
                    }
                    saveState();
                });
            
                document.getElementById('shape-text-color-input').addEventListener('input', (e) => {
                    const textElement = selectedElement.querySelector('.shape-text');
                    if (textElement) {
                        textElement.style.color = e.target.value;
                    }
                    saveState();
                });
            
                if (elementData.type === 'parallelogram') {
                    document.getElementById('shape-skew-input').addEventListener('input', (e) => {
                        selectedElement.style.transform = `skewX(${e.target.value}deg)`;
                        const textElement = selectedElement.querySelector('.shape-text');
                        if (textElement) {
                            textElement.style.transform = `skewX(${-e.target.value}deg)`;
                        }
                        saveState();
                    });
                }
            
                document.getElementById('shape-x-input').addEventListener('change', (e) => {
                    const x = parseInt(e.target.value);
                    if (!isNaN(x)) {
                        elementData.x = x;
                        selectedElement.style.left = `${x}px`;
                        updateConnections();
                        saveState();
                    }
                });
            
                document.getElementById('shape-y-input').addEventListener('change', (e) => {
                    const y = parseInt(e.target.value);
                    if (!isNaN(y)) {
                        elementData.y = y;
                        selectedElement.style.top = `${y}px`;
                        updateConnections();
                        saveState();
                    }
                });
            
                document.getElementById('shape-width-input').addEventListener('change', (e) => {
                    const width = Math.max(20, parseInt(e.target.value) || 100);
                    if (!isNaN(width)) {
                        elementData.width = width;
                        selectedElement.style.width = `${width}px`;
                        updateConnections();
                        saveState();
                    }
                });
            
                document.getElementById('shape-height-input').addEventListener('change', (e) => {
                    const height = Math.max(20, parseInt(e.target.value) || 100);
                    if (!isNaN(height)) {
                        elementData.height = height;
                        selectedElement.style.height = `${height}px`;
                        updateConnections();
                        saveState();
                    }
                });
            
                // Copy element button
                document.getElementById('copy-element').addEventListener('click', () => {
                    // Deep clone the element data including all properties
                    copiedElement = {
                        ...JSON.parse(JSON.stringify(elementData)),
                        // Reset position to be slightly offset
                        x: elementData.x + 20,
                        y: elementData.y + 20,
                        // Generate new ID
                        id: 'element-' + nextId
                    };
                    
                    // Also copy the element's DOM properties that aren't in elementData
                    const computedStyle = window.getComputedStyle(selectedElement);
                    copiedElement.borderRadius = computedStyle.borderRadius;
                    copiedElement.transform = computedStyle.transform;
                    
                    // Add visual feedback
                    selectedElement.classList.add('copied');
                    setTimeout(() => {
                        selectedElement.classList.remove('copied');
                    }, 500);
                    
                    // Enable paste button
                    document.getElementById('paste-element').disabled = false;
                    
                    showStatusMessage('Element copied to clipboard');
                });
            
                // Paste element button
                document.getElementById('paste-element').addEventListener('click', pasteElement);
            
                document.getElementById('delete-element').addEventListener('click', () => {
                    deleteElement(elementData);
                });
            
                if (elementData.type === 'rectangle') {
                    document.getElementById('shape-radius-input').addEventListener('input', (e) => {
                        selectedElement.style.borderRadius = `${e.target.value}px`;
                        saveState();
                    });
                }
            }
            
        
        // Get default color for shape type
        function getShapeColor(type) {
            switch (type) {
                case 'rectangle': return '#f1c40f';
                case 'circle': return '#9b59b6';
                case 'diamond': return '#1abc9c';
                case 'parallelogram': return '#e67e22';
                case 'document': return '#3498db';
                case 'hexagon': return '#9b59b6';
                default: return '#3498db';
            }
        }
        
        // Delete an element
        function deleteElement(elementData) {
            if (!confirm('Are you sure you want to delete this element?')) return;
            
            // Remove connections involving this element
            connections = connections.filter(conn => {
                if (conn.fromId === elementData.id || conn.toId === elementData.id) {
                    if (conn.element && conn.element.parentNode) {
                        conn.element.parentNode.removeChild(conn.element);
                    }
                    return false;
                }
                return true;
            });
            
            // Remove the element
            const index = elements.findIndex(el => el.id === elementData.id);
            if (index !== -1) {
                elements.splice(index, 1);
            }
            
            if (elementData.element && elementData.element.parentNode) {
                elementData.element.parentNode.removeChild(elementData.element);
            }
            
            selectedElement = null;
            propertiesPanel.innerHTML = '<p>Select an element to edit its properties.</p>';
            
            showStatusMessage('Element deleted');
            saveState();
        }
        
        // Start a connection from a connector
        function startConnection(e) {
            e.stopPropagation();
            connecting = true;
            connectionStart = e.target;
            
            const startRect = connectionStart.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const startX = startRect.left - canvasRect.left + startRect.width / 2 + canvas.scrollLeft;
            const startY = startRect.top - canvasRect.top + startRect.height / 2 + canvas.scrollTop;
            
            // Create temp connection line
            tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tempConnection.classList.add('connection-line');
            tempConnection.style.left = '0';
            tempConnection.style.top = '0';
            tempConnection.style.width = '100%';
            tempConnection.style.height = '100%';
            tempConnection.style.pointerEvents = 'none';
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('stroke', '#7f8c8d');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', startX);
            line.setAttribute('y2', startY);
            tempConnection.appendChild(line);
            
            canvas.appendChild(tempConnection);
            
            // Listen for mouse move on document to handle dragging outside canvas
            document.addEventListener('mousemove', handleTempConnectionMove);
            document.addEventListener('mouseup', handleTempConnectionEnd);
        }
        
        // Handle temp connection mouse move
        function handleTempConnectionMove(e) {
            if (!connecting || !tempConnection) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            const endX = e.clientX - canvasRect.left + canvas.scrollLeft;
            const endY = e.clientY - canvasRect.top + canvas.scrollTop;
            
            updateTempConnection(endX, endY);
        }
        
        // Update temp connection line
        function updateTempConnection(endX, endY) {
            if (!tempConnection || !connectionStart) return;
            
            const startRect = connectionStart.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const startX = startRect.left - canvasRect.left + startRect.width / 2 + canvas.scrollLeft;
            const startY = startRect.top - canvasRect.top + startRect.height / 2 + canvas.scrollTop;
            
            const line = tempConnection.querySelector('line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', endX);
            line.setAttribute('y2', endY);
        }

        // Clear canvas
function clearCanvas() {
    const saveFirst = confirm('Do you want to save the flowchart as an image before clearing?');
    
    if (saveFirst) {
        // Export as image first
        html2canvas(canvas, {
            backgroundColor: '#ffffff',
            scale: 2 // Higher quality
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'flowchart.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // After saving, clear the canvas
            performClear();
            showStatusMessage('Canvas cleared (image saved)');
        }).catch(error => {
            showStatusMessage('Error saving image: ' + error.message, true);
        });
    } else {
        // Just clear without saving
        performClear();
        showStatusMessage('Canvas cleared');
    }
}

// Helper function to perform the actual canvas clearing
function performClear() {
    // Remove all elements
    elements.forEach(el => {
        if (el.element && el.element.parentNode) {
            el.element.parentNode.removeChild(el.element);
        }
    });
    
    // Remove all connections
    connections.forEach(conn => {
        if (conn.element && conn.element.parentNode) {
            conn.element.parentNode.removeChild(conn.element);
        }
    });
    
    // Reset state
    elements = [];
    connections = [];
    selectedElement = null;
    nextId = 1;
    
    // Reset properties panel
    propertiesPanel.innerHTML = '<p>Select an element to edit its properties.</p>';
}
        
        // Handle temp connection end
        function handleTempConnectionEnd(e) {
            if (!connecting) return;
            
            document.removeEventListener('mousemove', handleTempConnectionMove);
            document.removeEventListener('mouseup', handleTempConnectionEnd);
            
            // Check if we're connecting to another connector
            let target = e.target;
            while (target && !target.classList.contains('connector')) {
                target = target.parentElement;
            }
            
            if (target && target.classList.contains('connector')) {
                // Check if we're not connecting to the same element
                if (target.dataset.parent !== connectionStart.dataset.parent) {
                    // Show connection properties modal
                    document.getElementById('connection-label').value = '';
                    connectionModal.style.display = 'flex';
                    
                    // Store connection data for when user saves
                    tempConnectionData = {
                        fromConnector: connectionStart,
                        toConnector: target
                    };
                } else {
                    // Connecting to same element - cancel
                    cancelConnection();
                }
            } else {
                // Didn't connect to anything - cancel
                cancelConnection();
            }
        }
        
        // Cancel connection
        function cancelConnection() {
            if (tempConnection && tempConnection.parentNode) {
                tempConnection.parentNode.removeChild(tempConnection);
            }
            tempConnection = null;
            connecting = false;
            connectionStart = null;
            connectionModal.style.display = 'none';
        }
        
        // Save connection
        function saveConnection() {
            const label = document.getElementById('connection-label').value.trim();
            
            // Get from and to elements
            const fromElement = elements.find(el => el.id === connectionStart.dataset.parent);
            const toElement = elements.find(el => el.id === tempConnectionData.toConnector.dataset.parent);
            
            if (!fromElement || !toElement) {
                cancelConnection();
                return;
            }
            
            // Create permanent connection
            const connectionId = 'connection-' + nextId++;
            const connectionElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            connectionElement.classList.add('connection-line');
            connectionElement.id = connectionId;
            connectionElement.style.left = '0';
            connectionElement.style.top = '0';
            connectionElement.style.width = '100%';
            connectionElement.style.height = '100%';
            connectionElement.style.pointerEvents = 'none';
            
            // Create arrow marker definition if not exists
            if (!document.getElementById('arrowhead')) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.id = 'arrowhead';
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '7');
                marker.setAttribute('refX', '9');
                marker.setAttribute('refY', '3.5');
                marker.setAttribute('orient', 'auto');
                
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                polygon.setAttribute('class', 'connection-arrow');
                
                marker.appendChild(polygon);
                defs.appendChild(marker);
                connectionElement.appendChild(defs);
            }
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('stroke', '#7f8c8d');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            connectionElement.appendChild(line);
            
            // Add label if exists
            if (label) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', '#2c3e50');
                text.setAttribute('text-anchor', 'middle');
                text.textContent = label;
                connectionElement.appendChild(text);
            }
            
            canvas.appendChild(connectionElement);
            
            // Remove temp connection
            if (tempConnection && tempConnection.parentNode) {
                tempConnection.parentNode.removeChild(tempConnection);
            }
            
            // Add to connections array
            const connection = {
                id: connectionId,
                fromId: fromElement.id,
                toId: toElement.id,
                fromSide: connectionStart.dataset.side,
                toSide: tempConnectionData.toConnector.dataset.side,
                label,
                element: connectionElement
            };
            
            connections.push(connection);
            
            // Update connection position
            updateConnection(connection);
            
            // Reset state
            tempConnection = null;
            connecting = false;
            connectionStart = null;
            connectionModal.style.display = 'none';
            
            showStatusMessage('Connection created');
            saveState();
        }
        
        // Update all connections
        function updateConnections() {
            connections.forEach(conn => updateConnection(conn));
        }

        /**
 * Previews the selected background image before applying
 */
function previewBackgroundImage() {
    const file = bgImageInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Show preview in modal (optional)
        const preview = document.getElementById('bg-image-preview');
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Removes the background image
 */
function removeBackgroundImage() {
    // Clear file input
    bgImageInput.value = '';
    
    // Hide preview if exists
    const preview = document.getElementById('bg-image-preview');
    if (preview) {
        preview.style.display = 'none';
    }
    
    // Show feedback
    showStatusMessage('Background image removed');
}
        
        // Update a single connection
        function updateConnection(connection) {
            const fromElement = elements.find(el => el.id === connection.fromId);
            const toElement = elements.find(el => el.id === connection.toId);
            
            if (!fromElement || !toElement || !connection.element) return;
            
            const fromRect = fromElement.element.getBoundingClientRect();
            const toRect = toElement.element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            // Calculate start point based on fromSide
            let startX, startY;
            switch (connection.fromSide) {
                case 'top':
                    startX = fromRect.left - canvasRect.left + fromRect.width / 2 + canvas.scrollLeft;
                    startY = fromRect.top - canvasRect.top + canvas.scrollTop;
                    break;
                case 'right':
                    startX = fromRect.left - canvasRect.left + fromRect.width + canvas.scrollLeft;
                    startY = fromRect.top - canvasRect.top + fromRect.height / 2 + canvas.scrollTop;
                    break;
                case 'bottom':
                    startX = fromRect.left - canvasRect.left + fromRect.width / 2 + canvas.scrollLeft;
                    startY = fromRect.top - canvasRect.top + fromRect.height + canvas.scrollTop;
                    break;
                case 'left':
                    startX = fromRect.left - canvasRect.left + canvas.scrollLeft;
                    startY = fromRect.top - canvasRect.top + fromRect.height / 2 + canvas.scrollTop;
                    break;
            }
            
            // Calculate end point based on toSide
            let endX, endY;
            switch (connection.toSide) {
                case 'top':
                    endX = toRect.left - canvasRect.left + toRect.width / 2 + canvas.scrollLeft;
                    endY = toRect.top - canvasRect.top + canvas.scrollTop;
                    break;
                case 'right':
                    endX = toRect.left - canvasRect.left + toRect.width + canvas.scrollLeft;
                    endY = toRect.top - canvasRect.top + toRect.height / 2 + canvas.scrollTop;
                    break;
                case 'bottom':
                    endX = toRect.left - canvasRect.left + toRect.width / 2 + canvas.scrollLeft;
                    endY = toRect.top - canvasRect.top + toRect.height + canvas.scrollTop;
                    break;
                case 'left':
                    endX = toRect.left - canvasRect.left + canvas.scrollLeft;
                    endY = toRect.top - canvasRect.top + toRect.height / 2 + canvas.scrollTop;
                    break;
            }
            
            // Update line
            const line = connection.element.querySelector('line');
            if (line) {
                line.setAttribute('x1', startX);
                line.setAttribute('y1', startY);
                line.setAttribute('x2', endX);
                line.setAttribute('y2', endY);
            }
            
            // Update label position
            const text = connection.element.querySelector('text');
            if (text) {
                text.setAttribute('x', (startX + endX) / 2);
                text.setAttribute('y', (startY + endY) / 2 - 5);
            }
        }
        
        // Show save JSON modal
        function showSaveJsonModal() {
            document.getElementById('json-modal-title').textContent = 'Save as JSON';
            document.getElementById('json-content').value = JSON.stringify({
                elements: elements.map(el => ({
                    id: el.id,
                    type: el.type,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    text: el.text,
                    color: el.color
                })),
                connections: connections.map(conn => ({
                    fromId: conn.fromId,
                    toId: conn.toId,
                    fromSide: conn.fromSide,
                    toSide: conn.toSide,
                    label: conn.label
                }))
            }, null, 2);
            
            document.getElementById('confirm-json').textContent = 'Copy to Clipboard';
            document.getElementById('confirm-json').onclick = copyToClipboard;
            
            jsonModal.style.display = 'flex';
        }
        
        // Show load JSON modal
        function showLoadJsonModal() {
            document.getElementById('json-modal-title').textContent = 'Load from JSON';
            document.getElementById('json-content').value = '';
            document.getElementById('confirm-json').textContent = 'Load';
            document.getElementById('confirm-json').onclick = loadFromJson;
            jsonModal.style.display = 'flex';
        }
        
        // Handle JSON modal confirm
        function handleJsonConfirm() {
            // This is set dynamically in showSaveJsonModal and showLoadJsonModal
        }
        
        // Copy to clipboard
        function copyToClipboard() {
            const jsonContent = document.getElementById('json-content');
            jsonContent.select();
            document.execCommand('copy');
            
            showStatusMessage('JSON copied to clipboard');
            jsonModal.style.display = 'none';
        }
        
        // Load from JSON
        function loadFromJson() {
            try {
                const json = JSON.parse(document.getElementById('json-content').value);
                
                // Clear current canvas
                clearCanvas();
                
                // Create elements
                if (json.elements && Array.isArray(json.elements)) {
                    json.elements.forEach(el => {
                        const shape = document.createElement('div');
                        shape.className = `flowchart-shape ${el.type}`;
                        shape.id = el.id;
                        shape.style.width = `${el.width}px`;
                        shape.style.height = `${el.height}px`;
                        shape.style.left = `${el.x}px`;
                        shape.style.top = `${el.y}px`;
                        shape.style.backgroundColor = el.color || getShapeColor(el.type);
                        
                        // Apply shape-specific styles
                        if (el.type === 'diamond') {
                            shape.style.transform = 'rotate(45deg)';
                        } else if (el.type === 'parallelogram') {
                            shape.style.transform = 'skewX(-20deg)';
                        }
                        
                        const text = document.createElement('div');
                        text.className = 'shape-text editable';
                        text.textContent = el.text || el.type;
                        text.style.color = getContrastColor(el.color || getShapeColor(el.type));
                        
                        if (el.type === 'diamond') {
                            text.style.transform = 'rotate(-45deg)';
                        } else if (el.type === 'parallelogram') {
                            text.style.transform = 'skewX(20deg)';
                        }
                        
                        shape.appendChild(text);
                        
                        // Add connectors
                        addConnectors(shape);
                        
                        canvas.appendChild(shape);
                        
                        // Add to elements array
                        elements.push({
                            id: el.id,
                            type: el.type,
                            x: el.x,
                            y: el.y,
                            width: el.width,
                            height: el.height,
                            text: el.text || el.type,
                            color: el.color || getShapeColor(el.type),
                            element: shape
                        });
                        
                        // Make text editable
                        makeTextEditable(text, el);
                        
                        // Update nextId to avoid conflicts
                        const idNum = parseInt(el.id.split('-')[1]);
                        if (idNum >= nextId) {
                            nextId = idNum + 1;
                        }
                    });
                }
                
                // Create connections
                if (json.connections && Array.isArray(json.connections)) {
                    json.connections.forEach(conn => {
                        const fromElement = elements.find(el => el.id === conn.fromId);
                        const toElement = elements.find(el => el.id === conn.toId);
                        
                        if (fromElement && toElement) {
                            const connectionElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            connectionElement.classList.add('connection-line');
                            connectionElement.id = 'connection-' + nextId++;
                            connectionElement.style.left = '0';
                            connectionElement.style.top = '0';
                            connectionElement.style.width = '100%';
                            connectionElement.style.height = '100%';
                            connectionElement.style.pointerEvents = 'none';
                            
                            // Create arrow marker definition if not exists
                            if (!document.getElementById('arrowhead')) {
                                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                                marker.id = 'arrowhead';
                                marker.setAttribute('markerWidth', '10');
                                marker.setAttribute('markerHeight', '7');
                                marker.setAttribute('refX', '9');
                                marker.setAttribute('refY', '3.5');
                                marker.setAttribute('orient', 'auto');
                                
                                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                                polygon.setAttribute('class', 'connection-arrow');
                                
                                marker.appendChild(polygon);
                                defs.appendChild(marker);
                                connectionElement.appendChild(defs);
                            }
                            
                            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line.setAttribute('stroke', '#7f8c8d');
                            line.setAttribute('stroke-width', '2');
                            line.setAttribute('marker-end', 'url(#arrowhead)');
                            connectionElement.appendChild(line);
                            
                            // Add label if exists
                            if (conn.label) {
                                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                text.setAttribute('font-size', '12');
                                text.setAttribute('fill', '#2c3e50');
                                text.setAttribute('text-anchor', 'middle');
                                text.textContent = conn.label;
                                connectionElement.appendChild(text);
                            }
                            
                            canvas.appendChild(connectionElement);
                            
                            // Add to connections array
                            connections.push({
                                id: connectionElement.id,
                                fromId: conn.fromId,
                                toId: conn.toId,
                                fromSide: conn.fromSide,
                                toSide: conn.toSide,
                                label: conn.label,
                                element: connectionElement
                            });
                        }
                    });
                }
                
                // Update all connections
                updateConnections();
                
                showStatusMessage('Flowchart loaded successfully');
                jsonModal.style.display = 'none';
                saveState();
            } catch (error) {
                showStatusMessage('Error loading JSON: ' + error.message, true);
            }
        }
        
        // Show export modal
        function showExportModal() {
            exportModal.style.display = 'flex';
        }
        
        // Handle export
        function handleExport() {
            const format = document.getElementById('export-format').value;
            
            switch(format) {
                case 'png':
                    exportAsImage();
                    break;
                case 'svg':
                    showStatusMessage('SVG export not implemented yet', true);
                    break;
                case 'pdf':
                    showStatusMessage('PDF export not implemented yet', true);
                    break;
                case 'code':
                    exportAsPseudocode();
                    break;
            }
            
            exportModal.style.display = 'none';
        }
        
        // Export as image
        function exportAsImage() {
            showStatusMessage('Exporting image...');
            
            html2canvas(canvas, {
                backgroundColor: '#ffffff',
                scale: 2 // Higher quality
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'flowchart.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                showStatusMessage('Image exported successfully');
            }).catch(error => {
                showStatusMessage('Error exporting image: ' + error.message, true);
            });
        }
        
        // Export as pseudocode
        function exportAsPseudocode() {
            let code = "// Generated Flowchart Pseudocode\n\n";
            
            // Find start elements (no incoming connections)
            const startElements = elements.filter(el => 
                !connections.some(conn => conn.toId === el.id)
            );
            
            if (startElements.length === 0 && elements.length > 0) {
                // If no obvious start elements but we have elements, just use the first one
                startElements.push(elements[0]);
            }
            
            startElements.forEach((el, index) => {
                code += `function ${sanitizeFunctionName(el.text)}() {\n`;
                generateCodeForElement(el, code, 1);
                code += "}\n\n";
            });
            
            // Create a modal to show the code
            document.getElementById('json-modal-title').textContent = 'Generated Pseudocode';
            document.getElementById('json-content').value = code;
            document.getElementById('confirm-json').textContent = 'Copy to Clipboard';
            document.getElementById('confirm-json').onclick = copyToClipboard;
            jsonModal.style.display = 'flex';
            
            showStatusMessage('Pseudocode generated');
        }
        
        function sanitizeFunctionName(name) {
            return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'process';
        }
        
        function generateCodeForElement(element, code, indentLevel) {
            const indent = '    '.repeat(indentLevel);
            
            // Add code for this element
            code += `${indent}// ${element.text}\n`;
            code += `${indent}perform_${element.type.toLowerCase()}("${element.text}");\n\n`;
            
            // Find outgoing connections
            const outgoingConnections = connections.filter(conn => conn.fromId === element.id);
            
            outgoingConnections.forEach(conn => {
                const nextElement = elements.find(el => el.id === conn.toId);
                if (nextElement) {
                    if (conn.label) {
                        code += `${indent}if (${conn.label}) {\n`;
                        generateCodeForElement(nextElement, code, indentLevel + 1);
                        code += `${indent}}\n`;
                    } else {
                        generateCodeForElement(nextElement, code, indentLevel);
                    }
                }
            });
        }
        
        
        
        // Show status message
        function showStatusMessage(message, isError = false) {
            statusMessage.textContent = message;
            statusMessage.className = isError ? 'status-message show error' : 'status-message show';
            
            setTimeout(() => {
                statusMessage.classList.remove('show');
            }, 3000);
        }
        
        // Initialize templates
        function initTemplates() {
            const templates = {
                'Start/End': {
                    type: 'circle',
                    text: 'Start',
                    width: 80,
                    height: 80,
                    color: '#2ecc71'
                },
                'Process': {
                    type: 'rectangle',
                    text: 'Process',
                    width: 120,
                    height: 60,
                    color: '#3498db'
                },
                'Decision': {
                    type: 'diamond',
                    text: 'Decision',
                    width: 100,
                    height: 100,
                    color: '#e74c3c'
                },
                'Input/Output': {
                    type: 'parallelogram',
                    text: 'Input',
                    width: 120,
                    height: 60,
                    color: '#f39c12'
                },
                'Document': {
                    type: 'document',
                    text: 'Document',
                    width: 120,
                    height: 80,
                    color: '#9b59b6'
                },
                'Subroutine': {
                    type: 'hexagon',
                    text: 'Subroutine',
                    width: 120,
                    height: 80,
                    color: '#1abc9c'
                }
            };
            
            const templatesList = document.getElementById('templates-list');
            templatesList.innerHTML = '';
            
            Object.entries(templates).forEach(([name, template]) => {
                const templateItem = document.createElement('div');
                templateItem.className = 'template-item';
                templateItem.innerHTML = `
                    <div class="template-preview">
                        <div class="flowchart-shape ${template.type}" 
                             style="width: ${template.width}px; height: ${template.height}px; 
                                    background-color: ${template.color}; transform: ${template.type === 'diamond' ? 'rotate(45deg)' : template.type === 'parallelogram' ? 'skewX(-20deg)' : 'none'};">
                            <div class="shape-text" style="transform: ${template.type === 'diamond' ? 'rotate(-45deg)' : template.type === 'parallelogram' ? 'skewX(20deg)' : 'none'}; 
                                                          color: ${getContrastColor(template.color)};">
                                ${template.text}
                            </div>
                        </div>
                    </div>
                    <div class="template-label">${name}</div>
                `;
                
                templateItem.addEventListener('click', () => {
                    addShape(template.type, template);
                    templatesModal.style.display = 'none';
                });
                
                templatesList.appendChild(templateItem);
            });
        }
        
        // Show templates modal
        function showTemplatesModal() {
            templatesModal.style.display = 'flex';
        }
        
        // Auto layout using dagre
        function autoLayout() {
            if (elements.length === 0) {
                showStatusMessage('No elements to layout', true);
                return;
            }
            
            showStatusMessage('Applying auto layout...');
            
            // Create a new directed graph
            const g = new dagre.graphlib.Graph();
            g.setGraph({
                rankdir: 'TB', // Top to Bottom layout
                nodesep: 50,   // Separation between nodes
                ranksep: 70    // Separation between ranks
            });
            g.setDefaultEdgeLabel(() => ({}));
            
            // Add nodes
            elements.forEach(el => {
                g.setNode(el.id, {
                    width: el.width,
                    height: el.height,
                    shape: el.type
                });
            });
            
            // Add edges
            connections.forEach(conn => {
                g.setEdge(conn.fromId, conn.toId);
            });
            
            // Run the layout
            dagre.layout(g);
            
            // Update positions
            g.nodes().forEach(id => {
                const node = g.node(id);
                const el = elements.find(el => el.id === id);
                if (el) {
                    el.x = node.x - node.width / 2;
                    el.y = node.y - node.height / 2;
                    el.element.style.left = `${el.x}px`;
                    el.element.style.top = `${el.y}px`;
                }
            });
            
            // Update connections
            updateConnections();
            
            showStatusMessage('Auto layout applied');
            saveState();
        }
        
        // Validate flowchart
        function validateFlowchart() {
            const errors = [];
            const validationResults = document.getElementById('validation-results');
            
            // Clear previous highlights
            elements.forEach(el => {
                el.element.classList.remove('highlight-warning');
            });
            
            // Check for unconnected elements
            elements.forEach(el => {
                const hasConnections = connections.some(conn => 
                    conn.fromId === el.id || conn.toId === el.id
                );
                if (!hasConnections) {
                    errors.push(`Element "${el.text}" is not connected`);
                    el.element.classList.add('highlight-warning');
                }
            });
            
            // Check for invalid connections
            connections.forEach(conn => {
                if (!elements.some(el => el.id === conn.fromId) || 
                    !elements.some(el => el.id === conn.toId)) {
                    errors.push(`Invalid connection between non-existent elements`);
                }
            });
            
            // Check for disconnected parts
            if (elements.length > 0) {
                const visited = new Set();
                const stack = [];
                
                // Start with elements that have no incoming connections
                const startElements = elements.filter(el => 
                    !connections.some(conn => conn.toId === el.id)
                );
                
                if (startElements.length === 0) {
                    // If no obvious start points, just use the first element
                    stack.push(elements[0].id);
                } else {
                    startElements.forEach(el => stack.push(el.id));
                }
                
                // Depth-first search
                while (stack.length > 0) {
                    const currentId = stack.pop();
                    visited.add(currentId);
                    
                    // Find all connected nodes
                    connections.forEach(conn => {
                        if (conn.fromId === currentId && !visited.has(conn.toId)) {
                            stack.push(conn.toId);
                        }
                    });
                }
                
                // Check if all elements were visited
                elements.forEach(el => {
                    if (!visited.has(el.id)) {
                        errors.push(`Element "${el.text}" is not reachable from the start`);
                        el.element.classList.add('highlight-warning');
                    }
                });
            }
            
            // Display results
            if (errors.length === 0) {
                validationResults.innerHTML = `
                    <div style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 4px;">
                        <h4 style="margin-top: 0;">Validation Successful</h4>
                        <p>No issues found in the flowchart.</p>
                    </div>
                `;
            } else {
                let errorsHtml = `
                    <div class="validation-errors">
                        <h4>Validation Errors (${errors.length})</h4>
                `;
                
                errors.forEach(error => {
                    errorsHtml += `<div class="validation-error">• ${error}</div>`;
                });
                
                errorsHtml += `</div>`;
                validationResults.innerHTML = errorsHtml;
            }
            
            validationResults.style.display = 'block';
            showStatusMessage(`Validation complete - ${errors.length} issues found`, errors.length > 0);
        }
        
        // Handle zoom
        function handleZoom(direction) {
            scale += direction * 0.1;
            scale = Math.max(0.5, Math.min(scale, 2)); // Limit zoom range
            updateCanvasTransform();
        }
        
        // Reset view
        function resetView() {
            scale = 1;
            panX = 0;
            panY = 0;
            updateCanvasTransform();
        }
        
        // Update canvas transform
        function updateCanvasTransform() {
            canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
            canvas.style.transformOrigin = '0 0';
        }
        
        // Handle shape search
        function handleShapeSearch(e) {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.shape-option').forEach(btn => {
                const matches = btn.textContent.toLowerCase().includes(term);
                btn.style.display = matches ? 'flex' : 'none';
            });
        }
        
        // Keyboard shortcuts
        function handleKeyboardShortcuts(e) {
            // Delete selected element
            if (e.key === 'Delete' && selectedElement) {
                deleteElement(elements.find(el => el.id === selectedElement.id));
            }
            
            // Copy/Paste
            if (e.ctrlKey && e.key === 'c' && selectedElement) {
                copiedElement = JSON.parse(JSON.stringify(elements.find(el => el.id === selectedElement.id)));
                showStatusMessage('Element copied to clipboard');
            }
            
            if (e.ctrlKey && e.key === 'v' && copiedElement) {
                pasteElement();
            }
            
            // Arrow key nudging
            if (selectedElement && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                nudgeElement(e.key);
            }
            
            // Undo/Redo
            if (e.ctrlKey && e.key === 'z') {
                undo();
            }
            
            if (e.ctrlKey && e.key === 'y') {
                redo();
            }
        }
        
        // Paste element
        function pasteElement() {
            if (!copiedElement) return;
            
            // Create a new element based on the copied one
            const newElement = JSON.parse(JSON.stringify(copiedElement));
            newElement.id = 'element-' + nextId++;
            newElement.x += 20;
            newElement.y += 20;
            
            const shape = document.createElement('div');
            shape.className = `flowchart-shape ${newElement.type}`;
            shape.id = newElement.id;
            shape.style.width = `${newElement.width}px`;
            shape.style.height = `${newElement.height}px`;
            shape.style.left = `${newElement.x}px`;
            shape.style.top = `${newElement.y}px`;
            shape.style.backgroundColor = newElement.color;
            
            const text = document.createElement('div');
            text.className = 'shape-text editable';
            text.textContent = newElement.text;
            text.style.color = getContrastColor(newElement.color);
            
            if (newElement.type === 'diamond') {
                shape.style.transform = 'rotate(45deg)';
                text.style.transform = 'rotate(-45deg)';
            } else if (newElement.type === 'parallelogram') {
                shape.style.transform = 'skewX(-20deg)';
                text.style.transform = 'skewX(20deg)';
            }
            
            shape.appendChild(text);
            
            // Add connectors
            addConnectors(shape);
            
            canvas.appendChild(shape);
            
            // Add to elements array
            elements.push({
                ...newElement,
                element: shape
            });
            
            // Make text editable
            makeTextEditable(text, newElement);
            
            // Select the new element
            selectElement(shape, newElement);
            
            showStatusMessage('Element pasted');
            saveState();
        }
        
        // Nudge element
        function nudgeElement(direction) {
            const elementData = elements.find(el => el.id === selectedElement.id);
            if (!elementData) return;
            
            const step = 5;
            switch(direction) {
                case 'ArrowUp':
                    elementData.y -= step;
                    selectedElement.style.top = `${elementData.y}px`;
                    break;
                case 'ArrowDown':
                    elementData.y += step;
                    selectedElement.style.top = `${elementData.y}px`;
                    break;
                case 'ArrowLeft':
                    elementData.x -= step;
                    selectedElement.style.left = `${elementData.x}px`;
                    break;
                case 'ArrowRight':
                    elementData.x += step;
                    selectedElement.style.left = `${elementData.x}px`;
                    break;
            }
            
            updateConnections();
            saveState();
        }
        
        // Save state to history
        function saveState() {
            // Only keep last 50 states
            const state = {
                elements: elements.map(el => ({ /* existing element data */ })),
                connections: connections.map(conn => ({ /* existing connection data */ })),
                background: {
                    color: bgColorInput.value,
                    gridEnabled: showGridCheckbox.checked,
                    gridSize: parseInt(gridSizeInput.value),
                    gridColor: gridColorInput.value,
                    snapToGrid: snapToGridCheckbox.checked,
                    bgImage: bgImageInput.files[0] ? true : false,
                    bgOpacity: parseInt(bgOpacityInput.value)
                }
            };
            if (history.length >= 50) {
                history.shift();
            }
            
            // Don't save if state hasn't changed
            const currentState = getCurrentState();
            if (history.length > 0 && JSON.stringify(history[history.length - 1]) === JSON.stringify(currentState)) {
                return;
            }
            
            history.push(currentState);
            currentHistoryIndex = history.length - 1;
        }
        
        // Get current state
        function getCurrentState() {
            return {
                elements: elements.map(el => ({
                    id: el.id,
                    type: el.type,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    text: el.text,
                    color: el.color
                })),
                connections: connections.map(conn => ({
                    fromId: conn.fromId,
                    toId: conn.toId,
                    fromSide: conn.fromSide,
                    toSide: conn.toSide,
                    label: conn.label
                }))
            };
        }

        function showBackgroundModal() {
            // Set current values
            bgColorInput.value = canvas.style.backgroundColor || '#ffffff';
            showGridCheckbox.checked = document.querySelector('.canvas-grid') !== null;
            gridSizeInput.value = gridSize;
            gridColorInput.value = '#e0e0e0'; // Default grid color
            snapToGridCheckbox.checked = snapToGrid;
            
            backgroundModal.style.display = 'flex';
        }

        
        // Apply background settings
    function applyBackgroundSettings() {
  
        canvas.style.backgroundColor = bgColorInput.value;
    
    // Handle grid
        let grid = document.querySelector('.canvas-grid');
        if (showGridCheckbox.checked) {
            if (!grid) {
                grid = document.createElement('div');
                grid.className = 'canvas-grid';
                canvas.insertBefore(grid, canvas.firstChild);
            }
            
            gridSize = parseInt(gridSizeInput.value);
            const gridColor = gridColorInput.value;
            
            grid.style.backgroundImage = `
                linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
            `;
            grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
        } else if (grid) {
            grid.remove();
        }
        
        // Set snap to grid
        snapToGrid = snapToGridCheckbox.checked;
        
        backgroundModal.style.display = 'none';
        showStatusMessage('Background settings applied');
        saveState();
    }
        // Handle background image upload
        
        function handleBgImageUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
        
            const reader = new FileReader();
            reader.onload = function(event) {
                // Remove any existing background image
                let bgImage = document.querySelector('.canvas-bg-image');
                if (bgImage) {
                    bgImage.remove();
                }
        
                // Create new background image element
                bgImage = document.createElement('div');
                bgImage.className = 'canvas-bg-image';
                
                // Set styles for the background image
                bgImage.style.position = 'absolute';
                bgImage.style.top = '0';
                bgImage.style.left = '0';
                bgImage.style.width = '100%';
                bgImage.style.height = '100%';
                bgImage.style.backgroundImage = `url(${event.target.result})`;
                bgImage.style.backgroundSize = 'cover';
                bgImage.style.backgroundPosition = 'center';
                bgImage.style.backgroundRepeat = 'no-repeat';
                bgImage.style.opacity = bgOpacityInput.value / 100;
                bgImage.style.zIndex = '-1';
                
                // Insert at the beginning of canvas
                canvas.insertBefore(bgImage, canvas.firstChild);
                
                showStatusMessage('Background image uploaded successfully');
            };
            reader.readAsDataURL(file);
        }
        function removeBgImage() {
            const bgImage = document.querySelector('.canvas-bg-image');
            if (bgImage) {
                bgImage.remove();
            }
            bgImageInput.value = '';
            showStatusMessage('Background image removed');
        }
        
       
        function drag(e) {
            if (!isDragging) return;
            
            // Handle panning
            if (selectedElement === null) {
                const dx = e.clientX - dragOffsetX;
                const dy = e.clientY - dragOffsetY;
                dragOffsetX = e.clientX;
                dragOffsetY = e.clientY;
                
                panX += dx;
                panY += dy;
                updateCanvasTransform();
                return;
            }
            
            // Get canvas position
            const canvasRect = canvas.getBoundingClientRect();
            
            // Calculate new position
            let x = e.clientX - canvasRect.left + canvas.scrollLeft - dragOffsetX;
            let y = e.clientY - canvasRect.top + canvas.scrollTop - dragOffsetY;
            
            // Snap to grid if enabled
            if (snapToGrid && gridSize > 0) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }
            
            // Apply the new position
            selectedElement.style.left = `${x}px`;
            selectedElement.style.top = `${y}px`;
            
            // Update the element data
            const elementData = elements.find(el => el.id === selectedElement.id);
            if (elementData) {
                elementData.x = x;
                elementData.y = y;
                showAlignmentGuides(elementData);
            }
            
            // Update connections
            updateConnections();
            
            // Update temp connection if exists
            if (tempConnection) {
                const endX = e.clientX - canvasRect.left + canvas.scrollLeft;
                const endY = e.clientY - canvasRect.top + canvas.scrollTop;
                updateTempConnection(endX, endY);
            }
        }

        /**
 * Applies all selected background features to the canvas
 */
        function applyBackgroundSettings() {
            // Apply background color
            canvas.style.backgroundColor = bgColorInput.value;
            
            // Handle grid
            let grid = document.querySelector('.canvas-grid');
            if (showGridCheckbox.checked) {
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'canvas-grid';
                    canvas.insertBefore(grid, canvas.firstChild);
                }
                
                gridSize = parseInt(gridSizeInput.value);
                const gridColor = gridColorInput.value;
                
                grid.style.backgroundImage = `
                    linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                    linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                `;
                grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
            } else if (grid) {
                grid.remove();
            }
            
            // Handle background image if one was uploaded
            if (bgImageInput.files && bgImageInput.files[0]) {
                handleBgImageUpload({ target: bgImageInput });
            }
            
            // Set snap to grid
            snapToGrid = snapToGridCheckbox.checked;
            
            backgroundModal.style.display = 'none';
            showStatusMessage('Background settings applied');
            saveState();
        }
        
        function restoreState(state) {
            if (state.background) {
                bgColorInput.value = state.background.color || '#ffffff';
                showGridCheckbox.checked = state.background.gridVisible || false;
                gridSizeInput.value = state.background.gridSize || 20;
                gridColorInput.value = state.background.gridColor || '#e0e0e0';
                snapToGridCheckbox.checked = state.background.snapToGrid || false;
                bgOpacityInput.value = state.background.bgOpacity * 100 || 100;
        
                // Restore background image if it exists
                if (state.background.bgImage) {
                    const bgImage = document.createElement('div');
                    bgImage.className = 'canvas-bg-image';
                    bgImage.style.position = 'absolute';
                    bgImage.style.top = '0';
                    bgImage.style.left = '0';
                    bgImage.style.width = '100%';
                    bgImage.style.height = '100%';
                    bgImage.style.backgroundImage = state.background.bgImage;
                    bgImage.style.backgroundSize = 'cover';
                    bgImage.style.backgroundPosition = 'center';
                    bgImage.style.backgroundRepeat = 'no-repeat';
                    bgImage.style.opacity = state.background.bgOpacity || 1;
                    bgImage.style.zIndex = '-1';
                    
                    // Remove existing background image if any
                    const existingBgImage = document.querySelector('.canvas-bg-image');
                    if (existingBgImage) {
                        existingBgImage.remove();
                    }
                    
                    canvas.insertBefore(bgImage, canvas.firstChild);
                }
            }
            
            // Apply all settings
            applyBackgroundSettings();
        }
        
        function saveState() {
          
            const state = {
                
                background: {
                    color: canvas.style.backgroundColor,
                    gridVisible: showGridCheckbox.checked,
                    gridSize: gridSize,
                    gridColor: gridColorInput.value,
                    snapToGrid: snapToGrid,
                    bgImage: document.querySelector('.canvas-bg-image')?.style.backgroundImage || null,
                    bgOpacity: document.querySelector('.canvas-bg-image')?.style.opacity || 1
                }
            };
            
           
        }
        
        
        
        // Undo
        function undo() {
            if (currentHistoryIndex > 0) {
                currentHistoryIndex--;
                restoreState(history[currentHistoryIndex]);
                showStatusMessage('Undo successful');
            } else {
                showStatusMessage('Nothing to undo', true);
            }
        }
        
        // Redo
        function redo() {
            if (currentHistoryIndex < history.length - 1) {
                currentHistoryIndex++;
                restoreState(history[currentHistoryIndex]);
                showStatusMessage('Redo successful');
            } else {
                showStatusMessage('Nothing to redo', true);
            }
        }
        
        // Restore state from history
        function restoreState(state) {
            // Clear current canvas
            elements.forEach(el => {
                if (el.element && el.element.parentNode) {
                    el.element.parentNode.removeChild(el.element);
                }
            });
            
            connections.forEach(conn => {
                if (conn.element && conn.element.parentNode) {
                    conn.element.parentNode.removeChild(conn.element);
                }
            });
            
            // Reset state
            elements = [];
            connections = [];
            selectedElement = null;
            
            // Create elements
            if (state.elements && Array.isArray(state.elements)) {
                state.elements.forEach(el => {
                    const shape = document.createElement('div');
                    shape.className = `flowchart-shape ${el.type}`;
                    shape.id = el.id;
                    shape.style.width = `${el.width}px`;
                    shape.style.height = `${el.height}px`;
                    shape.style.left = `${el.x}px`;
                    shape.style.top = `${el.y}px`;
                    shape.style.backgroundColor = el.color || getShapeColor(el.type);
                    
                    // Apply shape-specific styles
                    if (el.type === 'diamond') {
                        shape.style.transform = 'rotate(45deg)';
                    } else if (el.type === 'parallelogram') {
                        shape.style.transform = 'skewX(-20deg)';
                    }
                    
                    const text = document.createElement('div');
                    text.className = 'shape-text editable';
                    text.textContent = el.text || el.type;
                    text.style.color = getContrastColor(el.color || getShapeColor(el.type));
                    
                    if (el.type === 'diamond') {
                        text.style.transform = 'rotate(-45deg)';
                    } else if (el.type === 'parallelogram') {
                        text.style.transform = 'skewX(20deg)';
                    }
                    
                    shape.appendChild(text);
                    
                    // Add connectors
                    addConnectors(shape);
                    
                    canvas.appendChild(shape);
                    
                    // Add to elements array
                    elements.push({
                        id: el.id,
                        type: el.type,
                        x: el.x,
                        y: el.y,
                        width: el.width,
                        height: el.height,
                        text: el.text || el.type,
                        color: el.color || getShapeColor(el.type),
                        element: shape
                    });
                    
                    // Make text editable
                    makeTextEditable(text, el);
                    
                    // Update nextId to avoid conflicts
                    const idNum = parseInt(el.id.split('-')[1]);
                    if (idNum >= nextId) {
                        nextId = idNum + 1;
                    }
                });
            }
            
            // Create connections
            if (state.connections && Array.isArray(state.connections)) {
                state.connections.forEach(conn => {
                    const fromElement = elements.find(el => el.id === conn.fromId);
                    const toElement = elements.find(el => el.id === conn.toId);
                    
                    if (fromElement && toElement) {
                        const connectionElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        connectionElement.classList.add('connection-line');
                        connectionElement.id = 'connection-' + nextId++;
                        connectionElement.style.left = '0';
                        connectionElement.style.top = '0';
                        connectionElement.style.width = '100%';
                        connectionElement.style.height = '100%';
                        connectionElement.style.pointerEvents = 'none';
                        
                        // Create arrow marker definition if not exists
                        if (!document.getElementById('arrowhead')) {
                            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                            marker.id = 'arrowhead';
                            marker.setAttribute('markerWidth', '10');
                            marker.setAttribute('markerHeight', '7');
                            marker.setAttribute('refX', '9');
                            marker.setAttribute('refY', '3.5');
                            marker.setAttribute('orient', 'auto');
                            
                            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                            polygon.setAttribute('class', 'connection-arrow');
                            
                            marker.appendChild(polygon);
                            defs.appendChild(marker);
                            connectionElement.appendChild(defs);
                        }
                        
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('stroke', '#7f8c8d');
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('marker-end', 'url(#arrowhead)');
                        connectionElement.appendChild(line);
                        
                        // Add label if exists
                        if (conn.label) {
                            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            text.setAttribute('font-size', '12');
                            text.setAttribute('fill', '#2c3e50');
                            text.setAttribute('text-anchor', 'middle');
                            text.textContent = conn.label;
                            connectionElement.appendChild(text);
                        }
                        
                        canvas.appendChild(connectionElement);
                        
                        // Add to connections array
                        connections.push({
                            id: connectionElement.id,
                            fromId: conn.fromId,
                            toId: conn.toId,
                            fromSide: conn.fromSide,
                            toSide: conn.toSide,
                            label: conn.label,
                            element: connectionElement
                        });
                    }
                });
            }
            
            // Update all connections
            updateConnections();
            
            // Reset properties panel
            propertiesPanel.innerHTML = '<p>Select an element to edit its properties.</p>';
        }
        
        // Start interactive tutorial
        function startTutorial() {
            const tour = new Shepherd.Tour({
                defaultStepOptions: {
                    classes: 'shepherd-theme-dark',
                    scrollTo: true,
                    cancelIcon: {
                        enabled: true
                    }
                }
            });
            
            tour.addStep({
                id: 'welcome',
                text: 'Welcome to the Flowchart Builder! This tutorial will guide you through the main features.',
                buttons: [
                    {
                        text: 'Next',
                        action: tour.next
                    }
                ]
            });
            
            tour.addStep({
                id: 'shapes',
                attachTo: {
                    element: '.shape-palette',
                    on: 'bottom'
                },
                text: 'Use these buttons to add different shapes to your flowchart. Try clicking one!',
                buttons: [
                    {
                        text: 'Back',
                        action: tour.back
                    },
                    {
                        text: 'Next',
                        action: tour.next
                    }
                ]
            });
            
            tour.addStep({
                id: 'canvas',
                attachTo: {
                    element: '#flowchart-canvas',
                    on: 'bottom'
                },
                text: 'This is your canvas where you can drag and drop shapes to create your flowchart.',
                buttons: [
                    {
                        text: 'Back',
                        action: tour.back
                    },
                    {
                        text: 'Next',
                        action: tour.next
                    }
                ]
            });
            
            tour.addStep({
                id: 'properties',
                attachTo: {
                    element: '.properties-panel',
                    on: 'left'
                },
                text: 'The properties panel lets you customize selected elements - change text, colors, sizes and more.',
                buttons: [
                    {
                        text: 'Back',
                        action: tour.back
                    },
                    {
                        text: 'Next',
                        action: tour.next
                    }
                ]
            });
            
            tour.addStep({
                id: 'connections',
                text: 'To connect shapes, drag from one connector (blue dots) to another. Try it now!',
                buttons: [
                    {
                        text: 'Back',
                        action: tour.back
                    },
                    {
                        text: 'Finish',
                        action: tour.next
                    }
                ]
            });
            
            tour.start();
        }
    });
