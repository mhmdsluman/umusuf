// js/utils.js

/**
 * Shows a modal dialog with a given title and content.
 * @param {string} title - The title to display in the modal header.
 * @param {string | HTMLElement} content - The HTML string or element to display in the modal body.
 * @param {Function} onSave - The callback function to execute when the save button is clicked.
 */
export function showModal(title, content, onSave) {
    const modal = document.getElementById('modal-template');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const saveButton = document.getElementById('modal-save-button');
    const cancelButton = document.getElementById('modal-cancel-button');

    modalTitle.textContent = title;
    
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.innerHTML = ''; // Clear previous content
        modalBody.appendChild(content);
    }

    // Use a fresh event listener to avoid stacking old ones
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    
    if (onSave) {
        newSaveButton.style.display = '';
        newSaveButton.addEventListener('click', onSave);
    } else {
        newSaveButton.style.display = 'none';
    }


    cancelButton.onclick = () => hideModal();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Hides the currently active modal.
 */
export function hideModal() {
    const modal = document.getElementById('modal-template');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('modal-body').innerHTML = ''; // Clean up
}

/**
 * Shows a custom confirmation dialog.
 * @param {string} message - The confirmation message to display.
 * @param {Function} onConfirm - The callback to execute if the user confirms.
 */
export function showConfirm(message, onConfirm) {
    const confirmContent = `
        <p>${message}</p>
    `;
    
    const handleConfirm = () => {
        onConfirm();
        hideModal();
    };
    
    showModal('تأكيد الإجراء', confirmContent, handleConfirm);
}


/**
 * Displays a toast notification with a message.
 * @param {string} message - The message to show in the toast.
 * @param {('success'|'error'|'info')} type - The type of toast, for styling.
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;

    // Reset classes
    toast.className = 'fixed bottom-5 left-5 py-2 px-4 rounded-lg shadow-lg text-white';

    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        default:
            toast.classList.add('bg-gray-900');
            break;
    }

    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Shows or hides the main loading spinner.
 * @param {boolean} isLoading - True to show the spinner, false to hide it.
 */
export function showLoader(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    // Add a null check to prevent errors if the element doesn't exist
    if (!spinner) return;

    if (isLoading) {
        spinner.style.display = 'flex';
        spinner.style.opacity = '1';
    } else {
        spinner.style.opacity = '0';
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 300); // Match transition duration
    }
}

/**
 * Renders Lucide icons on the page.
 * Call this after new content with `data-lucide` attributes is added to the DOM.
 */
export function renderIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}
