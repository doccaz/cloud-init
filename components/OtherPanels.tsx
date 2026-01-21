import React, { useState } from 'react';
import { AppState, FileConfig, NetworkV1Interface, NetworkV1Subnet, NetworkV1Route } from '../types';
import { Button, Input, Label, TextArea, Card, Select } from './UI';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const GroupsPanel: React.FC<Props> = ({ state, setState }) => {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');

  const add = () => {
    if (!name) return;
    const group = members ? { name, members: members.split(',').map(m => m.trim()) } : name;
    setState(s => ({ ...s, groups: [...s.groups, group] }));
    setName('');
    setMembers('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Group Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label>Members (comma sep)</Label><Input value={members} onChange={e => setMembers(e.target.value)} /></div>
      </div>
      <div className="flex justify-end"><Button onClick={add}>Add Group</Button></div>
      <div className="space-y-2">
        {state.groups.map((g, i) => (
            <Card key={i} title={typeof g === 'string' ? g : g.name} onRemove={() => setState(s => ({...s, groups: s.groups.filter((_, idx) => idx !== i)}))}>
                {typeof g !== 'string' && <div className="text-xs text-gray-400">Members: {g.members?.join(', ')}</div>}
            </Card>
        ))}
      </div>
    </div>
  );
};

export const PackagesPanel: React.FC<Props> = ({ state, setState }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-md">
            <input 
                type="checkbox" 
                id="pkg_update"
                checked={state.package_update}
                onChange={e => setState(s => ({ ...s, package_update: e.target.checked }))}
                className="rounded bg-gray-600 border-gray-500 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="pkg_update" className="text-sm text-gray-200">
                Update packages on first boot (apt-get update)
            </label>
        </div>
        <div>
            <Label>Packages (one per line)</Label>
            <TextArea 
                rows={10} 
                value={state.packages.join('\n')} 
                onChange={e => setState(s => ({ ...s, packages: e.target.value.split('\n') }))} 
                placeholder="nginx&#10;vim&#10;htop"
            />
        </div>
    </div>
);

export const FilesPanel: React.FC<Props> = ({ state, setState }) => {
    const [file, setFile] = useState<FileConfig>({ path: '', content: '' });

    const add = () => {
        if (!file.path) return;
        setState(s => ({...s, files: [...s.files, file]}));
        setFile({ path: '', content: '' });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Path</Label><Input value={file.path} onChange={e => setFile({...file, path: e.target.value})} placeholder="/etc/config.conf" /></div>
                <div><Label>Permissions</Label><Input value={file.permissions || ''} onChange={e => setFile({...file, permissions: e.target.value})} placeholder="0644" /></div>
            </div>
            <div>
                 <Label>Content</Label>
                 <TextArea rows={5} value={file.content || ''} onChange={e => setFile({...file, content: e.target.value})} />
            </div>
            <div className="flex justify-end"><Button onClick={add}>Add File</Button></div>
            <div className="space-y-2">
                {state.files.map((f, i) => (
                    <Card key={i} title={f.path} onRemove={() => setState(s => ({...s, files: s.files.filter((_, idx) => idx !== i)}))} />
                ))}
            </div>
        </div>
    );
};

export const RunCmdPanel: React.FC<Props> = ({ state, setState }) => (
    <div className="space-y-6">
        <div>
            <Label title="runcmd: Runs once per instance">Run Commands (runcmd)</Label>
            <p className="text-xs text-gray-500 mb-2">Use string format or JSON array format (e.g. <code>["cmd", "arg"]</code>) for explicit argument parsing.</p>
            <TextArea rows={6} value={state.runcmd.join('\n')} onChange={e => setState(s => ({ ...s, runcmd: e.target.value.split('\n') }))} placeholder="echo 'Hello'&#10;['systemctl', 'start', 'nginx']" />
        </div>
        <div>
            <Label title="bootcmd: Runs every boot (early)">Boot Commands (bootcmd)</Label>
            <p className="text-xs text-gray-500 mb-2">Use string format or JSON array format.</p>
            <TextArea rows={6} value={state.bootcmd.join('\n')} onChange={e => setState(s => ({ ...s, bootcmd: e.target.value.split('\n') }))} />
        </div>
    </div>
);

// V1 Network Sub-Components
const V1InterfaceEditor: React.FC<{ 
    iface: NetworkV1Interface, 
    onChange: (i: NetworkV1Interface) => void, 
    onRemove: () => void 
}> = ({ iface, onChange, onRemove }) => {
    
    const updateSubnet = (idx: number, patch: Partial<NetworkV1Subnet>) => {
        const newSubnets = [...iface.subnets];
        newSubnets[idx] = { ...newSubnets[idx], ...patch };
        onChange({ ...iface, subnets: newSubnets });
    };

    const addRoute = (subnetIdx: number) => {
        const newSubnets = [...iface.subnets];
        const currentRoutes = newSubnets[subnetIdx].routes || [];
        newSubnets[subnetIdx].routes = [...currentRoutes, { network: '0.0.0.0', netmask: '0.0.0.0', gateway: '0.0.0.0' }];
        onChange({ ...iface, subnets: newSubnets });
    };

    const updateRoute = (subnetIdx: number, routeIdx: number, patch: Partial<NetworkV1Route>) => {
        const newSubnets = [...iface.subnets];
        if (!newSubnets[subnetIdx].routes) return;
        const newRoutes = [...(newSubnets[subnetIdx].routes as NetworkV1Route[])];
        newRoutes[routeIdx] = { ...newRoutes[routeIdx], ...patch };
        newSubnets[subnetIdx].routes = newRoutes;
        onChange({ ...iface, subnets: newSubnets });
    };

    const removeRoute = (subnetIdx: number, routeIdx: number) => {
        const newSubnets = [...iface.subnets];
        if (!newSubnets[subnetIdx].routes) return;
        newSubnets[subnetIdx].routes = newSubnets[subnetIdx].routes?.filter((_, i) => i !== routeIdx);
        onChange({ ...iface, subnets: newSubnets });
    };

    return (
        <div className="bg-gray-800 border border-gray-600 rounded p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
                 <div className="flex space-x-2 w-full mr-4">
                     <div className="w-1/3">
                        <Label>Interface</Label>
                        <Input value={iface.name} onChange={e => onChange({...iface, name: e.target.value})} placeholder="eth0" />
                     </div>
                     <div className="w-2/3">
                        <Label>MAC (Optional)</Label>
                        <Input value={iface.mac_address || ''} onChange={e => onChange({...iface, mac_address: e.target.value})} placeholder="xx:xx:xx:xx:xx:xx" />
                     </div>
                 </div>
                 <Button variant="danger" onClick={onRemove} className="h-10 mt-6">Remove</Button>
            </div>
            
            <div className="space-y-3 pl-4 border-l-2 border-gray-700">
                {iface.subnets.map((subnet, sIdx) => (
                    <div key={sIdx} className="bg-gray-750 p-3 rounded">
                        <div className="mb-2">
                             <Label>Type</Label>
                             <Select value={subnet.type} onChange={e => updateSubnet(sIdx, { type: e.target.value as any })}>
                                 <option value="dhcp">DHCP (IPv4)</option>
                                 <option value="dhcp4">DHCP4</option>
                                 <option value="dhcp6">DHCP6</option>
                                 <option value="static">Static</option>
                             </Select>
                        </div>
                        {['static'].includes(subnet.type) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                <div><Label>Address</Label><Input value={subnet.address || ''} onChange={e => updateSubnet(sIdx, { address: e.target.value })} placeholder="192.168.1.10" /></div>
                                <div><Label>Netmask</Label><Input value={subnet.netmask || ''} onChange={e => updateSubnet(sIdx, { netmask: e.target.value })} placeholder="255.255.255.0" /></div>
                                <div><Label>Gateway</Label><Input value={subnet.gateway || ''} onChange={e => updateSubnet(sIdx, { gateway: e.target.value })} placeholder="192.168.1.1" /></div>
                            </div>
                        )}
                        
                        <div className="mt-2">
                            <Label>DNS Nameservers (comma separated)</Label>
                            <Input 
                                value={subnet.dns_nameservers?.join(', ') || ''} 
                                onChange={e => updateSubnet(sIdx, { dns_nameservers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                placeholder="8.8.8.8, 1.1.1.1" 
                            />
                        </div>

                        {/* Routes Section */}
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <Label>Routes</Label>
                                <button onClick={() => addRoute(sIdx)} className="text-xs text-cyan-400 hover:text-cyan-300 underline">+ Add Route</button>
                            </div>
                            {subnet.routes?.map((route, rIdx) => (
                                <div key={rIdx} className="flex space-x-2 items-end mb-2">
                                    <div className="flex-1"><Label>Network</Label><Input value={route.network} onChange={e => updateRoute(sIdx, rIdx, {network: e.target.value})} placeholder="10.0.0.0" className="h-8 text-xs" /></div>
                                    <div className="flex-1"><Label>Netmask</Label><Input value={route.netmask} onChange={e => updateRoute(sIdx, rIdx, {netmask: e.target.value})} placeholder="255.0.0.0" className="h-8 text-xs" /></div>
                                    <div className="flex-1"><Label>Gateway</Label><Input value={route.gateway} onChange={e => updateRoute(sIdx, rIdx, {gateway: e.target.value})} placeholder="192.168.1.1" className="h-8 text-xs" /></div>
                                    <button onClick={() => removeRoute(sIdx, rIdx)} className="text-red-400 p-2">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const NetworkPanel: React.FC<Props> = ({ state, setState }) => {
    
    // Templates
    const applyV2Template = (type: 'dhcp' | 'static') => {
        let configObj = {};
        if (type === 'dhcp') {
            configObj = {
                ethernets: {
                    eth0: {
                        dhcp4: true
                    }
                }
            };
        } else {
            configObj = {
                ethernets: {
                    eth0: {
                        addresses: ["192.168.1.100/24"],
                        routes: [{ to: "default", via: "192.168.1.1" }],
                        nameservers: {
                            addresses: ["8.8.8.8", "1.1.1.1"]
                        }
                    }
                }
            };
        }
        setState(s => ({ ...s, networkVersion: 'v2', networkV2Yaml: JSON.stringify(configObj, null, 2) }));
    };

    const applyV1Template = (type: 'dhcp' | 'static') => {
        let newInterfaces: NetworkV1Interface[] = [];
        if (type === 'dhcp') {
            newInterfaces = [{
                name: 'eth0',
                type: 'physical',
                subnets: [{ type: 'dhcp' }]
            }];
        } else {
            newInterfaces = [{
                name: 'eth0',
                type: 'physical',
                subnets: [{
                    type: 'static',
                    address: '192.168.1.100',
                    netmask: '255.255.255.0',
                    gateway: '192.168.1.1',
                    dns_nameservers: ['8.8.8.8', '1.1.1.1']
                }]
            }];
        }
        setState(s => ({ ...s, networkVersion: 'v1', networkV1: newInterfaces }));
    };

    const addV1Interface = () => {
        const newIface: NetworkV1Interface = {
            type: 'physical',
            name: `eth${state.networkV1.length}`,
            subnets: [{ type: 'dhcp' }]
        };
        setState(s => ({ ...s, networkV1: [...s.networkV1, newIface] }));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Hostname</Label><Input value={state.hostname} onChange={e => setState(s => ({...s, hostname: e.target.value}))} /></div>
                <div className="flex items-center pt-6">
                    <input type="checkbox" checked={state.manageHosts} onChange={e => setState(s => ({...s, manageHosts: e.target.checked}))} className="rounded bg-gray-700 text-cyan-600" />
                    <span className="ml-2 text-sm text-gray-300">Manage /etc/hosts</span>
                </div>
            </div>
            <hr className="border-gray-700" />
            
            <div className="flex justify-between items-center">
                <div>
                    <Label>Network Version</Label>
                    <Select value={state.networkVersion} onChange={e => setState(s => ({...s, networkVersion: e.target.value as any}))} className="w-48">
                        <option value="v1">v1 (Legacy / ENI)</option>
                        <option value="v2">v2 (Netplan)</option>
                    </Select>
                </div>
                <div className="text-right">
                    <Label>Quick Templates ({state.networkVersion})</Label>
                    <div className="flex space-x-2 mt-1">
                        <Button variant="secondary" onClick={() => state.networkVersion === 'v1' ? applyV1Template('dhcp') : applyV2Template('dhcp')} className="py-1 text-xs">DHCP eth0</Button>
                        <Button variant="secondary" onClick={() => state.networkVersion === 'v1' ? applyV1Template('static') : applyV2Template('static')} className="py-1 text-xs">Static eth0</Button>
                    </div>
                </div>
            </div>

            {state.networkVersion === 'v2' && (
                <div>
                     <Label>Netplan Configuration (JSON)</Label>
                     <p className="text-xs text-gray-400 mb-2">Configure network using Netplan syntax (version 2). Please use JSON format.</p>
                     <TextArea 
                        rows={12} 
                        value={state.networkV2Yaml} 
                        onChange={e => setState(s => ({...s, networkV2Yaml: e.target.value}))} 
                        placeholder='{"ethernets": {"eth0": {"dhcp4": true}}}'
                        className="font-mono text-sm"
                     />
                </div>
            )}

            {state.networkVersion === 'v1' && (
                <div className="space-y-4">
                     <p className="text-xs text-gray-400">Configure interfaces individually. This generates <code>network: {'{ version: 1, config: [...] }'}</code>.</p>
                     
                     {state.networkV1.map((iface, idx) => (
                         <V1InterfaceEditor 
                            key={idx} 
                            iface={iface} 
                            onChange={(updated) => {
                                const list = [...state.networkV1];
                                list[idx] = updated;
                                setState(s => ({ ...s, networkV1: list }));
                            }}
                            onRemove={() => setState(s => ({ ...s, networkV1: s.networkV1.filter((_, i) => i !== idx) }))}
                         />
                     ))}

                     <Button onClick={addV1Interface} variant="success" className="w-full">+ Add Interface</Button>
                </div>
            )}
        </div>
    );
};