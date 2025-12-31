'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

const WEEKDAYS = [
    { value: 'MO', label: 'L' },
    { value: 'TU', label: 'M' },
    { value: 'WE', label: 'X' },
    { value: 'TH', label: 'J' },
    { value: 'FR', label: 'V' },
    { value: 'SA', label: 'S' },
    { value: 'SU', label: 'D' },
];

interface RecurrenceEditorProps {
    value: string | undefined;
    onChange: (rrule: string | undefined) => void;
}

export function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
    const [type, setType] = useState<RecurrenceType>('none');
    const [weekDays, setWeekDays] = useState<string[]>([]);
    const [monthDay, setMonthDay] = useState(1);
    const [customRRule, setCustomRRule] = useState('');

    // Parse initial value
    useEffect(() => {
        if (!value) {
            setType('none');
            return;
        }

        if (value === 'FREQ=DAILY') {
            setType('daily');
        } else if (value.startsWith('FREQ=WEEKLY')) {
            setType('weekly');
            const match = value.match(/BYDAY=([A-Z,]+)/);
            if (match && match[1]) {
                setWeekDays(match[1].split(','));
            }
        } else if (value.startsWith('FREQ=MONTHLY')) {
            setType('monthly');
            const match = value.match(/BYMONTHDAY=(\d+)/);
            if (match && match[1]) {
                setMonthDay(parseInt(match[1], 10));
            }
        } else {
            setType('custom');
            setCustomRRule(value);
        }
    }, []);

    const handleTypeChange = (newType: RecurrenceType) => {
        setType(newType);
        if (newType === 'none') {
            onChange(undefined);
        } else if (newType === 'daily') {
            onChange('FREQ=DAILY');
        }
    };

    const toggleWeekDay = (day: string) => {
        const newDays = weekDays.includes(day)
            ? weekDays.filter((d) => d !== day)
            : [...weekDays, day];
        setWeekDays(newDays);
        if (newDays.length > 0) {
            onChange(`FREQ=WEEKLY;BYDAY=${newDays.join(',')}`);
        } else {
            onChange(undefined);
        }
    };

    const handleMonthDayChange = (day: number) => {
        setMonthDay(day);
        onChange(`FREQ=MONTHLY;BYMONTHDAY=${day}`);
    };

    return (
        <div className="space-y-3">
            <Label>Repetición</Label>
            <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar repetición" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Sin repetición</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensualmente</SelectItem>
                    <SelectItem value="custom">Personalizado (RRULE)</SelectItem>
                </SelectContent>
            </Select>

            {type === 'weekly' && (
                <div className="flex gap-1">
                    {WEEKDAYS.map((day) => (
                        <Button
                            key={day.value}
                            type="button"
                            variant={weekDays.includes(day.value) ? 'default' : 'outline'}
                            size="sm"
                            className="w-9 h-9 p-0"
                            onClick={() => toggleWeekDay(day.value)}
                        >
                            {day.label}
                        </Button>
                    ))}
                </div>
            )}

            {type === 'monthly' && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">El día</span>
                    <Input
                        type="number"
                        min={1}
                        max={31}
                        value={monthDay}
                        onChange={(e) => handleMonthDayChange(Number(e.target.value))}
                        className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">de cada mes</span>
                </div>
            )}

            {type === 'custom' && (
                <div className="space-y-2">
                    <Input
                        value={customRRule}
                        onChange={(e) => {
                            setCustomRRule(e.target.value);
                            onChange(e.target.value || undefined);
                        }}
                        placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                    />
                    <p className="text-xs text-muted-foreground">
                        Formato RFC 5545 RRULE. Ejemplo: FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
                    </p>
                </div>
            )}
        </div>
    );
}
