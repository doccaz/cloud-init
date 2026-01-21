import React, { useState, useEffect, useRef } from 'react';
import { AppState } from './types';
import { generateYaml, generateConfigObject, parseYaml } from './utils/configHelper';
import { TabButton } from './components/UI';
import { UsersPanel } from './components/UsersPanel';
import { GroupsPanel, PackagesPanel, FilesPanel, RunCmdPanel, NetworkPanel } from './components/OtherPanels';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<AppState>({
    users: [],
    chpasswdUsers: [],
    chpasswdExpire: false,
    groups: [],
    packages: [],
    package_update: false,
    files: [],
    runcmd: [],
    bootcmd: [],
    hostname: '',
    manageHosts: false,
    networkVersion: 'v2',
    networkV1: [],
    networkV2Yaml: '',
    ssh_pwauth: true,
    global_ssh_keys: [],
  });

  useEffect(() => {
    const config = generateConfigObject(state);
    setGeneratedOutput(generateYaml(config));
  }, [state]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOutput);
    alert('Copied to clipboard!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Safer access to files array
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const newState = parseYaml(content);
        setState(newState);
        alert('Configuration imported successfully!');
      } catch (err: any) {
        alert(err.message || 'Failed to parse configuration file.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedOutput(e.target.value);
  };

  const handleApplyYaml = () => {
    try {
      const newState = parseYaml(generatedOutput);
      setState(newState);
      // We don't alert on success here to keep the flow smooth, 
      // the re-formatting of YAML by useEffect serves as visual confirmation.
    } catch (err: any) {
      alert('Failed to parse YAML:\n' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 relative">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".yaml,.yml,.txt" 
      />

      <a href="https://github.com" target="_blank" rel="noreferrer" className="github-corner absolute bottom-0 right-0 z-50" aria-label="View source on GitHub">
        <svg width="80" height="80" viewBox="0 0 250 250" style={{ fill: '#0891b2', color: '#fff', position: 'absolute', bottom: 0, right: 0, border: 0, transform: 'rotate(90deg)' }} aria-hidden="true">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style={{ transformOrigin: '130px 106px' }} className="octo-arm"></path>
          <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" className="octo-body"></path>
        </svg>
      </a>

      <header className="bg-gray-800 shadow-md flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white leading-tight">
            Visual <span className="text-cyan-400">cloud-config</span> Generator
          </h1>
          <div className="flex items-center space-x-4">
            <button 
                onClick={handleImportClick}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-3 rounded transition-colors"
                title="Upload a .yaml file"
            >
                Import File
            </button>
            <span className="text-xs text-gray-500">v2.2.0 (Stable)</span>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 gap-6 flex flex-col lg:flex-row">
        {/* Left Panel: Controls */}
        <div className="lg:w-1/2 flex flex-col bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <nav className="flex border-b border-gray-700 bg-gray-850">
            {['users', 'groups', 'packages', 'files', 'runcmd', 'network'].map(tab => (
              <TabButton 
                key={tab} 
                active={activeTab === tab} 
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabButton>
            ))}
          </nav>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'users' && <UsersPanel state={state} setState={setState} />}
            {activeTab === 'groups' && <GroupsPanel state={state} setState={setState} />}
            {activeTab === 'packages' && <PackagesPanel state={state} setState={setState} />}
            {activeTab === 'files' && <FilesPanel state={state} setState={setState} />}
            {activeTab === 'runcmd' && <RunCmdPanel state={state} setState={setState} />}
            {activeTab === 'network' && <NetworkPanel state={state} setState={setState} />}
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:w-1/2 flex flex-col bg-gray-800 rounded-lg shadow-xl overflow-hidden">
           <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-850">
               <h2 className="text-lg font-medium text-white">Generated YAML</h2>
               <div className="flex space-x-2">
                 <button 
                  onClick={handleApplyYaml}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                  title="Parse and load the YAML from the text area into the GUI"
                 >
                     Load YAML
                 </button>
                 <button 
                  onClick={copyToClipboard}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                 >
                     Copy
                 </button>
               </div>
           </div>
           <div className="flex-1 relative">
               <textarea 
                value={generatedOutput}
                onChange={handleTextChange}
                placeholder="Paste cloud-config YAML here and click 'Load YAML'..."
                className="absolute inset-0 w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-none focus:ring-0"
               />
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;