/**
 * DisplayCard Component Tests
 * Basic tests for display card rendering
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisplayCard } from './DisplayCard';
import { DisplayStatus } from '@shared-types';
import type { Display } from '@shared-types';

describe('DisplayCard', () => {
  const mockDisplay: Display = {
    id: 'display-123',
    name: 'Lobby Display',
    location: 'Main Lobby',
    status: DisplayStatus.ONLINE,
    hotelId: 'hotel-1',
    areaId: null,
    lastSeen: new Date(),
    deviceInfo: null,
    pairingCode: null,
    pairedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render display name', () => {
    render(<DisplayCard display={mockDisplay} />);
    expect(screen.getByText('Lobby Display')).toBeInTheDocument();
  });

  it('should render display location', () => {
    render(<DisplayCard display={mockDisplay} />);
    expect(screen.getByText('Main Lobby')).toBeInTheDocument();
  });

  it('should show online badge for online status', () => {
    render(<DisplayCard display={mockDisplay} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show offline badge for offline status', () => {
    const offlineDisplay = { ...mockDisplay, status: DisplayStatus.OFFLINE };
    render(<DisplayCard display={offlineDisplay} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should show error badge for error status', () => {
    const errorDisplay = { ...mockDisplay, status: DisplayStatus.ERROR };
    render(<DisplayCard display={errorDisplay} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should display truncated ID', () => {
    render(<DisplayCard display={mockDisplay} />);
    // ID is truncated to 8 characters
    expect(screen.getByText('display-')).toBeInTheDocument();
  });

  it('should show "Just now" for recent lastSeen', () => {
    const recentDisplay = {
      ...mockDisplay,
      lastSeen: new Date(),
    };
    render(<DisplayCard display={recentDisplay} />);
    expect(screen.getByText(/Last seen:/)).toBeInTheDocument();
    expect(screen.getByText(/Just now/)).toBeInTheDocument();
  });

  it('should show "Never" when lastSeen is null', () => {
    const neverSeenDisplay = {
      ...mockDisplay,
      lastSeen: null,
    };
    render(<DisplayCard display={neverSeenDisplay} />);
    expect(screen.getByText(/Never/)).toBeInTheDocument();
  });

  it('should display area ID when present', () => {
    const displayWithArea = {
      ...mockDisplay,
      areaId: 'area-123',
    };
    render(<DisplayCard display={displayWithArea} />);
    expect(screen.getByText(/Area:/)).toBeInTheDocument();
    expect(screen.getByText('area-123')).toBeInTheDocument();
  });

  it('should not display area section when areaId is null', () => {
    render(<DisplayCard display={mockDisplay} />);
    expect(screen.queryByText(/Area:/)).not.toBeInTheDocument();
  });
});
