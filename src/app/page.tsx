"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InstructorTable from "../components/InstructorTable";
import SearchParamsProvider from "../components/SearchParamsProvider";
import database from "../data/Database.json";

export default function Home() {
  const db = database;
  const router = useRouter();
  
  // Initialize state from URL parameters
  const [instructorMode, setInstructorMode] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState<string>(db.instructors[0]?.short || "");

  return (
    <SearchParamsProvider>
      {(searchParams) => (
        <HomeContent 
          searchParams={searchParams}
          router={router}
          db={db}
          instructorMode={instructorMode}
          setInstructorMode={setInstructorMode}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
        />
      )}
    </SearchParamsProvider>
  );
}

interface Database {
  Department: string;
  days: string[];
  time_slots: string[];
  batches: Array<{
    batch: string;
    room_no: string;
    schedule: {
      [day: string]: Array<{ course?: string; instructor?: string }> | undefined;
    };
  }>;
  instructors: Array<{
    short: string;
    full_name: string;
  }>;
}

interface HomeContentProps {
  searchParams: URLSearchParams;
  router: { push: (url: string, options?: { scroll: boolean }) => void };
  db: Database;
  instructorMode: boolean;
  setInstructorMode: (value: boolean) => void;
  selectedBatch: number;
  setSelectedBatch: (value: number) => void;
  selectedInstructor: string;
  setSelectedInstructor: (value: string) => void;
}

function HomeContent({
  searchParams,
  router,
  db,
  instructorMode,
  setInstructorMode,
  selectedBatch,
  setSelectedBatch,
  selectedInstructor,
  setSelectedInstructor
}: HomeContentProps) {
  // Initialize state from URL parameters on component mount
  useEffect(() => {
    const mode = searchParams.get('mode');
    const batch = searchParams.get('batch');
    const instructor = searchParams.get('instructor');

    if (mode === 'instructor') {
      setInstructorMode(true);
    } else {
      setInstructorMode(false);
    }

    if (batch && !isNaN(Number(batch))) {
      const batchIndex = Number(batch);
      if (batchIndex >= 0 && batchIndex < db.batches.length) {
        setSelectedBatch(batchIndex);
      }
    }

    if (instructor && db.instructors.find((inst) => inst.short === instructor)) {
      setSelectedInstructor(instructor);
    }
  }, [searchParams, db.batches.length, db.instructors, setInstructorMode, setSelectedBatch, setSelectedInstructor]);

  const batches = db.batches;
  const days = db.days;
  const timeSlots = db.time_slots;
  const currentBatch = batches[selectedBatch];

  // Function to get days that have actual classes for the current batch
  const getActiveDays = () => {
    if (!currentBatch.schedule) return [];
    
    return days.filter((day: string) => {
      const daySchedule = currentBatch.schedule?.[day];
      if (!daySchedule || !Array.isArray(daySchedule)) return false;
      
      // Check if any time slot has a course (not empty or just break)
      return daySchedule.some(slot => 
        slot && slot.course && slot.course !== "BREAK" && slot.course !== "Project Work"
      );
    });
  };

  const activeDays = instructorMode ? days : getActiveDays();

  // Function to update URL parameters
  const updateURL = (newMode?: boolean, newBatch?: number, newInstructor?: string) => {
    const params = new URLSearchParams();
    
    if (newMode !== undefined) {
      params.set('mode', newMode ? 'instructor' : 'student');
    } else {
      params.set('mode', instructorMode ? 'instructor' : 'student');
    }
    
    if (newBatch !== undefined) {
      params.set('batch', newBatch.toString());
    } else {
      params.set('batch', selectedBatch.toString());
    }
    
    if (newInstructor !== undefined) {
      params.set('instructor', newInstructor);
    } else {
      params.set('instructor', selectedInstructor);
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Enhanced state setters that also update URL
  const handleModeChange = (newMode: boolean) => {
    setInstructorMode(newMode);
    updateURL(newMode, undefined, undefined);
  };

  const handleBatchChange = (newBatch: number) => {
    setSelectedBatch(newBatch);
    updateURL(undefined, newBatch, undefined);
  };

  const handleInstructorChange = (newInstructor: string) => {
    setSelectedInstructor(newInstructor);
    updateURL(undefined, undefined, newInstructor);
  };

  return (
    <div className="container">
      <header>
        <div className="title">
          <h1>UCASM <p>Department of CSE</p></h1>
        </div>
        <div>
          <button
            className="btn"
            onClick={() => handleModeChange(!instructorMode)}
          >
            {instructorMode ? "Switch to Student Mode" : "Switch to Instructor Mode"}
          </button>
        </div>
      </header>
      <main>
        <div className="batch-info" style={{display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between"}}>
          <div>
            {instructorMode ? (
              <h2 id="currentBatch">{db.instructors.find((i) => i.short === selectedInstructor)?.full_name || ""}</h2>
            ) : (
              <>
                <h2 id="currentBatch">{currentBatch.batch}</h2>
                <p>
                  Room: <span id="roomNo">{currentBatch.room_no}</span>
                </p>
              </>
            )}
          </div>
          <div className="batch-selector" style={{display: "flex", gap: 12, alignItems: "center"}}>
            <select
              id="batchSelect"
              value={instructorMode ? selectedInstructor : String(selectedBatch)}
              onChange={e => {
                if (instructorMode) {
                  handleInstructorChange(e.target.value);
                } else {
                  handleBatchChange(Number(e.target.value));
                }
              }}
            >
              {instructorMode
                ? db.instructors.map((inst) => (
                    <option key={inst.short} value={inst.short}>{inst.full_name}</option>
                  ))
                : batches.map((batch, idx: number) => (
                    <option key={batch.batch} value={idx}>{batch.batch}</option>
                  ))}
            </select>
          </div>
        </div>
        <div className="schedule-container">
          {instructorMode ? (
            <InstructorTable selectedInstructor={selectedInstructor} />
          ) : (
            <table id="scheduleTable">
              <thead>
                <tr>
                  <th>Time/Day</th>
                  {activeDays.map((day: string) => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot: string, slotIdx: number) => (
                  <tr key={slotIdx}>
                    <td className="cell-regular">{slot}</td>
                    {activeDays.map((day: string) => {
                      const dayArr = currentBatch.schedule?.[day] || [];
                      const cell = Array.isArray(dayArr) && dayArr[slotIdx] ? dayArr[slotIdx] : undefined;
                      return (
                        <td key={day} className={cell && cell.course ? (cell.course.toLowerCase().includes("lab") ? "cell-lab" : "cell-regular") : "cell-empty"}>
                          {cell && cell.course ? (
                            <>
                              <span>{cell.course}</span>
                              {cell.instructor && <span>{` (${cell.instructor})`}</span>}
                            </>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p className="copyright">
            © 2025 Created by <strong>SAJID HASAN</strong> from CSE-12
          </p>
          <div className="social-links">
            <a 
              href="https://github.com/developersajidxyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="GitHub Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/in/thesajidhasan/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="LinkedIn Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
