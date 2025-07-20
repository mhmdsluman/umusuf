// js/db.js

// Create a new Dexie database instance.
const db = new Dexie('TahfeezDB');

/**
 * Define the database schema and its versions.
 * It is crucial to list all versions sequentially to ensure Dexie can upgrade correctly.
 */

// Version 1: The initial schema of the application.
db.version(1).stores({
    students: 'id, class_id, name, *tags',
    classes: 'id, name',
    attendance: '[student_id+date], date, status',
    exams: 'id, student_id, date',
    financials: 'id, student_id, month_year, type',
    notifications: '++id, is_read, timestamp',
    settings: 'key',
    tasmee3: '[student_id+sura+page], student_id',
});

// Version 2: Added 'plans' and 'expenses' tables, and new fields.
db.version(2).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee',
  plans: 'id, name', 
  attendance: '[student_id+date], date, status',
  exams: 'id, student_id, date',
  financials: '[student_id+month_year], student_id, status',
  notifications: '++id, is_read, timestamp',
  settings: 'key',
  tasmee3: '++id, student_id, sura, page, timestamp',
  expenses: 'id, date',
}).upgrade(tx => {
    return tx.table('classes').toCollection().modify(cls => {
        if (cls.fee === undefined) {
            cls.fee = 0;
        }
    });
});

// Version 3: Corrected 'tasmee3' table for accurate tracking.
db.version(3).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee',
  plans: 'id, name', 
  attendance: '[student_id+date], date, status',
  exams: 'id, student_id, date',
  financials: '[student_id+month_year], student_id, status',
  notifications: '++id, is_read, timestamp',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
}).upgrade(tx => {
    return tx.table('tasmee3').clear();
});

// Version 4: Cleaned up schema to use auto-incrementing keys for attendance and financials.
db.version(4).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee',
  plans: 'id, name', 
  attendance: '++id, [student_id+date]',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year]',
  notifications: '++id, is_read, timestamp',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});

// Version 5: Added index for financials table.
db.version(5).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee',
  plans: 'id, name', 
  attendance: '++id, [student_id+date]',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});

// Version 6: Added date index for attendance table.
db.version(6).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee',
  plans: 'id, name', 
  attendance: '++id, [student_id+date], date',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});

// Version 7: The latest version with time and schedule days for classes.
db.version(7).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee, time, *schedule_days', // Added time and schedule_days
  plans: 'id, name', 
  attendance: '++id, [student_id+date], date',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp, reference_id', // Added reference_id for system notifications
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});


/**
 * A generic function to save or update data in a specific table.
 * This centralizes data writing logic.
 *
 * @param {string} tableName The name of the table to save to.
 * @param {object} data The object to save. It must have an 'id' property for updates.
 * @returns {Promise<any>} A promise that resolves with the id of the saved item.
 */
export async function saveData(tableName, data) {
    if (!db[tableName]) {
        console.error(`Table "${tableName}" does not exist in the database.`);
        throw new Error(`Table "${tableName}" does not exist.`);
    }
    try {
        if (!data.id && tableName !== 'settings' && !data.hasOwnProperty('++id')) {
             data.id = crypto.randomUUID();
        }
        const id = await db[tableName].put(data);
        console.log(`Data saved to ${tableName} with id: ${id}`);
        return id;
    } catch (error) {
        console.error(`Error saving data to ${tableName}:`, error);
        throw error;
    }
}

// Export the database instance.
export { db };
