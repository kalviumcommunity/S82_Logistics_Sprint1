import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import NavigationDock from './NavigationDock.jsx';
import AlertToastContainer from './AlertToastContainer.jsx';

export const CommandDeckLayout = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans relative">
      {/* Real-time Floating Industrial Alert Toast Stack */}
      <AlertToastContainer />

      {/* Global Telemetry & WebSocket Connection Status Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        <Outlet />
      </main>

      {/* Bottom Floating Tactical Flight-Deck Navigation Dock */}
      <NavigationDock />
    </div>
  );
};

export default CommandDeckLayout;
