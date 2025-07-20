// js/sync.js
import { db } from './db.js';
import { showToast } from './utils.js';

// --- Supabase Client Setup ---
// IMPORTANT: Replace these with your actual Supabase project credentials.
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
let supabase = null;

// Initialize the Supabase client if credentials are provided
try {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase client initialized.");
    } else {
        console.warn("Supabase credentials not provided. Sync is disabled.");
    }
} catch (e) {
    console.error("Error initializing Supabase client:", e);
}

// --- UI Functions ---

/**
 * Updates the sync status indicator in the UI.
 * @param {string} status - Optional status like 'syncing'.
 */
export function updateSyncStatus(status = '') {
    const statusDiv = document.getElementById('sync-status-indicator');
    const syncIcon = document.getElementById('sync-button-icon');
    if (!statusDiv || !syncIcon) return;

    if (status === 'syncing') {
        statusDiv.textContent = 'جاري المزامنة...';
        statusDiv.className = 'text-xs text-yellow-500';
        syncIcon.classList.add('animate-spin');
    } else if (navigator.onLine && supabase) {
        statusDiv.textContent = 'متصل';
        statusDiv.className = 'text-xs text-green-500';
        syncIcon.classList.remove('animate-spin');
    } else {
        statusDiv.textContent = 'غير متصل';
        statusDiv.className = 'text-xs text-gray-500';
        syncIcon.classList.remove('animate-spin');
    }
}

// --- Main Sync Logic ---

/**
 * Main function to trigger the synchronization process.
 * This function pulls data from Supabase and overwrites local data ("remote wins").
 * @param {boolean} isManual - True if the sync was triggered by a user click.
 */
export async function syncData(isManual = false) {
    if (!supabase) {
        if (isManual) showToast('خدمة المزامنة غير مهيأة. الرجاء إضافة بيانات Supabase.', 'info');
        return;
    }

    if (!navigator.onLine) {
        if (isManual) showToast('لا يمكن المزامنة. تأكد من اتصالك بالإنترنت.', 'error');
        updateSyncStatus();
        return;
    }
    
    // In a real app with user authentication, you would get the user from Supabase.
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //     if (isManual) showToast('يجب تسجيل الدخول للمزامنة.', 'error');
    //     return;
    // }

    updateSyncStatus('syncing');
    
    try {
        const tablesToSync = ['students', 'classes', 'plans', 'expenses', 'notifications', 'attendance', 'exams', 'financials', 'settings'];
        
        // This is a simplified "remote wins" strategy.
        // It fetches all data and overwrites local tables.
        await db.transaction('rw', ...db.tables, async () => {
            for (const tableName of tablesToSync) {
                // For a multi-user app, you would add .eq('user_id', user.id)
                const { data, error } = await supabase.from(tableName).select('*');
                
                if (error) {
                    throw new Error(`Error fetching ${tableName}: ${error.message}`);
                }

                if (data) {
                    await db[tableName].clear();
                    await db[tableName].bulkPut(data);
                }
            }
        });

        if (isManual) showToast('تمت مزامنة البيانات بنجاح!');
        
        // Reload the current page's data to reflect changes
        window.dispatchEvent(new CustomEvent('datachanged'));

    } catch (error) {
        console.error("Sync Error:", error);
        if (isManual) showToast(`خطأ في المزامنة: ${error.message}`, 'error');
    } finally {
        updateSyncStatus();
    }
}
