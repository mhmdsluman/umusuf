// js/db.js

// Create a new Dexie database instance.
const db = new Dexie('TahfeezDB');

/**
 * Define the database schema and its versions.
 * It is crucial to list all versions sequentially to ensure Dexie can upgrade correctly.
 */

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

db.version(7).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee, time, *schedule_days',
  plans: 'id, name', 
  attendance: '++id, [student_id+date], date',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp, reference_id',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});

db.version(8).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee, time, *schedule_days, whatsapp_link, telegram_link',
  plans: 'id, name', 
  attendance: '++id, [student_id+date], date',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp, reference_id',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});

// Version 9: The latest version with a full teachers feature.
db.version(9).stores({
  students: 'id, class_id, name, plan_id, sex',
  classes: 'id, name, fee, time, *schedule_days, whatsapp_link, telegram_link, teacher_id', // Added teacher_id
  plans: 'id, name', 
  teachers: 'id, name', // New teachers table
  teacher_salaries: '++id, [teacher_id+month_year], month_year', // New table for salaries
  attendance: '++id, [student_id+date], date',
  exams: 'id, student_id, date',
  financials: '++id, [student_id+month_year], month_year',
  notifications: '++id, is_read, timestamp, reference_id',
  settings: 'key',
  tasmee3: '++id, student_id, page_number, timestamp',
  expenses: 'id, date',
});


/**
 * A generic function to save or update data in a specific table.
 * This centralizes data writing logic.
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