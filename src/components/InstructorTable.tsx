import React from "react";
import database from "../data/Database.json";

type Instructor = {
  short: string;
  full_name: string;
};

type Batch = {
  batch: string;
  room_no: string;
  schedule: {
    [day: string]: Array<{ course?: string; instructor?: string }> | undefined;
  };
};

type Database = {
  Department: string;
  days: string[];
  time_slots: string[];
  batches: Batch[];
  instructors: Instructor[];
};

const buildInstructorGrid = (db: Database, instructorShort: string) => {
  // Map day -> slotIdx -> array of assignments for that instructor
  const grid: Record<string, Record<number, Array<{ course: string; batch: string }>>> = {};
  db.days.forEach((day) => {
    grid[day] = {};
    db.time_slots.forEach((_, idx) => {
      grid[day][idx] = [];
    });
  });

  db.batches.forEach((batch) => {
    Object.entries(batch.schedule).forEach(([day, slots]) => {
      if (!Array.isArray(slots)) return;
      slots.forEach((slot, idx) => {
        if (!slot || Object.keys(slot).length === 0) return;
        if (slot.instructor === instructorShort && slot.course) {
          grid[day]?.[idx]?.push({ course: slot.course, batch: batch.batch });
        }
      });
    });
  });

  return grid;
};

type Props = { selectedInstructor: string };

const InstructorTable: React.FC<Props> = ({ selectedInstructor }) => {
  const db = database;
  const grid = buildInstructorGrid(db as Database, selectedInstructor);

  return (
    <div className="schedule-container" style={{ marginTop: 0, marginLeft: 0, marginRight: 0 }}>
      <table>
        <thead>
          <tr>
            <th>Time / Day</th>
            {db.days.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {db.time_slots.map((slot, idx) => (
            <tr key={slot}>
              <td className="cell-regular" style={{fontWeight: 600}}>{slot}</td>
              {db.days.map((day) => (
                <td key={`${slot}-${day}`} className="cell-empty" style={{verticalAlign: "top", minWidth: 120}}>
                  {Array.isArray(grid[day]?.[idx]) && grid[day][idx].length > 0 ? (
                    <div style={{display: "flex", flexDirection: "column", gap: 4}}>
                      {grid[day][idx].map((item, i) => (
                        <div key={i}>
                          <span>{item.course}</span>
                          <span> ({item.batch.split(" (")[0]})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InstructorTable;
