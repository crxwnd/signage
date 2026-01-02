'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { Schedule } from '@/lib/api/schedules';

interface ScheduleCalendarProps {
    schedules: Schedule[];
    onEventClick?: (schedule: Schedule) => void;
    onDateClick?: (date: Date) => void;
}

export function ScheduleCalendar({
    schedules,
    onEventClick,
    onDateClick,
}: ScheduleCalendarProps) {
    const events = schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.name,
        start: schedule.startDate,
        end: schedule.endDate || undefined,
        extendedProps: { schedule },
        backgroundColor: schedule.isActive ? '#254D6E' : '#94a3b8',
        borderColor: schedule.isActive ? '#254D6E' : '#94a3b8',
    }));

    return (
        <div className="fc-container">
            <style jsx global>{`
        .fc-container .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent) / 0.1);
          font-family: inherit;
        }
        .fc-container .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600;
        }
        .fc-container .fc-button {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }
        .fc-container .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
        }
        .fc-container .fc-daygrid-day-number {
          color: hsl(var(--foreground));
        }
        .fc-container .fc-col-header-cell-cushion {
          color: hsl(var(--foreground));
        }
      `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                eventClick={(info) => {
                    const schedule = info.event.extendedProps.schedule as Schedule;
                    onEventClick?.(schedule);
                }}
                dateClick={(info) => {
                    onDateClick?.(info.date);
                }}
                height="auto"
                dayMaxEvents={3}
                locale="es"
                buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                }}
            />
        </div>
    );
}
