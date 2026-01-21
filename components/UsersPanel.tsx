import React, { useState } from 'react';
import { AppState, User, ChpasswdUser } from '../types';
import { Button, Input, Label, Select, TextArea, Card } from './UI';
import { generateSalt, sha512crypt } from '../utils/sha512';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const UsersPanel: React.FC<Props> = ({ state, setState }) => {
  const [mode, setMode] = useState<'create' | 'update'>('create');
  
  // Create User Form State
  const [newUser, setNewUser] = useState<User>({ name: '' });
  const [userPassType, setUserPassType] = useState<'hashed' | 'plain'>('hashed');
  const [tempPass, setTempPass] = useState('');

  // Update Password Form State
  const [updateUser, setUpdateUser] = useState<ChpasswdUser>({ name: '', password: '' });
  const [updatePassType, setUpdatePassType] = useState<'hashed' | 'plain'>('hashed');
  const [tempUpdatePass, setTempUpdatePass] = useState('');

  const handleHash = (password: string, setter: (val: string) => void) => {
    if (!password) return;
    try {
      const salt = generateSalt(16);
      const hash = sha512crypt(password, '$6$' + salt);
      setter(hash);
    } catch (e) {
      alert('Error generating hash');
    }
  };

  const addCreatedUser = () => {
    if (!newUser.name) return alert('Username required');
    
    const userToAdd: User = { ...newUser };
    if (tempPass) {
        if (userPassType === 'hashed') userToAdd.passwd = tempPass;
        else userToAdd.plain_text_passwd = tempPass;
    }
    
    // Clean up arrays
    if (typeof userToAdd.groups === 'string') {
        userToAdd.groups = (userToAdd.groups as string).split(',').map(s => s.trim()).filter(Boolean);
    }
     if (typeof userToAdd.ssh_authorized_keys === 'string') {
        userToAdd.ssh_authorized_keys = (userToAdd.ssh_authorized_keys as string).split('\n').filter(Boolean);
    }

    setState(prev => ({ ...prev, users: [...prev.users, userToAdd] }));
    setNewUser({ name: '' });
    setTempPass('');
  };

  const addChpasswdUser = () => {
    if (!updateUser.name) return alert('Username required');
    if (!tempUpdatePass) return alert('Password required');

    setState(prev => ({ 
        ...prev, 
        chpasswdUsers: [...prev.chpasswdUsers, { name: updateUser.name, password: tempUpdatePass }] 
    }));
    setUpdateUser({ name: '', password: '' });
    setTempUpdatePass('');
  };

  const handleEditUser = (index: number) => {
    const user = state.users[index];
    // Remove from list
    setState(prev => ({ ...prev, users: prev.users.filter((_, i) => i !== index) }));
    
    // Populate form
    setMode('create');
    
    // Handle password fields
    if (user.passwd) {
        setUserPassType('hashed');
        setTempPass(user.passwd);
    } else if (user.plain_text_passwd) {
        setUserPassType('plain');
        setTempPass(user.plain_text_passwd);
    } else {
        setTempPass('');
    }

    // Transform arrays back to strings for editing inputs if necessary
    // The ssh_authorized_keys input uses TextArea which expects a string during editing (via cast 'as any' in JSX)
    const sshKeysStr = Array.isArray(user.ssh_authorized_keys) ? user.ssh_authorized_keys.join('\n') : (user.ssh_authorized_keys || '');
    const groupsStr = Array.isArray(user.groups) ? user.groups.join(', ') : (user.groups || '');

    setNewUser({
        ...user,
        ssh_authorized_keys: sshKeysStr as any,
        groups: groupsStr as any
    });
  };

  const handleEditChpasswd = (index: number) => {
    const user = state.chpasswdUsers[index];
    setState(prev => ({ ...prev, chpasswdUsers: prev.chpasswdUsers.filter((_, i) => i !== index) }));
    
    setMode('update');
    setUpdateUser({ name: user.name, password: '' }); // Don't wipe password immediately, allow checking type
    
    // Simple heuristic: if it looks like a hash, set hashed, otherwise plain
    // $6$ is standard for sha512crypt
    if (user.password.startsWith('$')) {
        setUpdatePassType('hashed');
    } else {
        setUpdatePassType('plain');
    }
    setTempUpdatePass(user.password);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-md space-y-3">
          <h3 className="text-md font-bold text-cyan-400 uppercase tracking-wider">Global SSH Configuration</h3>
          <div className="flex items-center space-x-2">
               <input 
                 type="checkbox" 
                 id="ssh_pwauth"
                 checked={state.ssh_pwauth} 
                 onChange={e => setState(s => ({...s, ssh_pwauth: e.target.checked}))} 
                 className="rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" 
               />
               <label htmlFor="ssh_pwauth" className="text-sm text-gray-300">Enable SSH Password Authentication (ssh_pwauth)</label>
          </div>
          <div>
              <Label title="ssh_authorized_keys: Adds keys to the default user">Global SSH Authorized Keys (default user)</Label>
              <TextArea 
                rows={2} 
                placeholder="ssh-rsa AAAA..." 
                value={state.global_ssh_keys.join('\n')}
                onChange={e => setState(s => ({...s, global_ssh_keys: e.target.value.split('\n').filter(x => x.trim())}))}
              />
          </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 bg-gray-700 p-1 rounded-lg">
        <button
          className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'create' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'}`}
          onClick={() => setMode('create')}
        >
          Create New User
        </button>
        <button
          className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'update' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'}`}
          onClick={() => setMode('update')}
        >
          Update Password (chpasswd)
        </button>
      </div>

      {mode === 'create' ? (
        <div className="space-y-4 border border-gray-700 p-4 rounded-md animate-fade-in bg-gray-800/50">
           <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">Add New User</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                   <Label>Username</Label>
                   <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. admin" />
               </div>
               <div>
                   <Label>Gecos</Label>
                   <Input value={newUser.gecos || ''} onChange={e => setNewUser({...newUser, gecos: e.target.value})} placeholder="Full Name" />
               </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label>Groups (comma separated)</Label>
                    <Input 
                        value={newUser.groups as any || ''} 
                        onChange={e => setNewUser({...newUser, groups: e.target.value as any})} 
                        placeholder="sudo, docker" 
                    />
                </div>
                <div>
                    <Label>Shell</Label>
                    <Input value={newUser.shell || ''} onChange={e => setNewUser({...newUser, shell: e.target.value})} placeholder="/bin/bash" />
                </div>
           </div>
           
           <div>
               <Label>Password</Label>
               <div className="flex space-x-2 mt-1">
                   <Select value={userPassType} onChange={e => setUserPassType(e.target.value as any)} className="w-32">
                       <option value="hashed">Hashed ($6$)</option>
                       <option value="plain">Plain Text</option>
                   </Select>
                   <Input 
                        value={tempPass} 
                        onChange={e => setTempPass(e.target.value)} 
                        placeholder={userPassType === 'hashed' ? "Click 'Hash' to generate" : "Enter plain password"}
                   />
                   {userPassType === 'hashed' && (
                       <Button variant="secondary" onClick={() => handleHash(tempPass, setTempPass)}>Hash</Button>
                   )}
               </div>
           </div>

           <div>
                <Label>SSH Keys (one per line)</Label>
                <TextArea 
                    rows={3} 
                    value={newUser.ssh_authorized_keys as any || ''}
                    onChange={e => setNewUser({...newUser, ssh_authorized_keys: e.target.value as any})} 
                />
           </div>

           <div className="flex flex-wrap gap-4">
               <label className="flex items-center space-x-2 text-sm text-gray-300">
                   <input type="checkbox" checked={!!newUser.sudo} onChange={e => setNewUser({...newUser, sudo: e.target.checked ? 'ALL=(ALL) NOPASSWD:ALL' : false})} className="rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                   <span>Sudo (NOPASSWD)</span>
               </label>
               <label className="flex items-center space-x-2 text-sm text-gray-300">
                   <input type="checkbox" checked={!!newUser.lock_passwd} onChange={e => setNewUser({...newUser, lock_passwd: e.target.checked})} className="rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                   <span>Lock Password</span>
               </label>
           </div>
           
           <div className="flex justify-end">
               <Button onClick={addCreatedUser}>Add User</Button>
           </div>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-700 p-4 rounded-md animate-fade-in bg-gray-800/50">
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">Update User Password</h3>
            <p className="text-xs text-gray-400">Uses the <code>chpasswd</code> module to update passwords for existing users (e.g. default 'ubuntu' user) without recreating them.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <Label>Username</Label>
                   <Input value={updateUser.name} onChange={e => setUpdateUser({...updateUser, name: e.target.value})} placeholder="e.g. ubuntu" />
                </div>
            </div>

            <div>
               <Label>New Password</Label>
               <div className="flex space-x-2 mt-1">
                   <Select value={updatePassType} onChange={e => setUpdatePassType(e.target.value as any)} className="w-32">
                       <option value="hashed">Hashed ($6$)</option>
                       <option value="plain">Plain Text</option>
                   </Select>
                   <Input 
                        value={tempUpdatePass} 
                        onChange={e => setTempUpdatePass(e.target.value)} 
                        placeholder={updatePassType === 'hashed' ? "Click 'Hash' to generate" : "Enter plain password"}
                   />
                   {updatePassType === 'hashed' && (
                       <Button variant="secondary" onClick={() => handleHash(tempUpdatePass, setTempUpdatePass)}>Hash</Button>
                   )}
               </div>
           </div>

           <div className="flex justify-between items-center pt-2">
               <label className="flex items-center space-x-2 text-sm text-gray-300">
                   <input 
                    type="checkbox" 
                    checked={state.chpasswdExpire} 
                    onChange={e => setState(s => ({...s, chpasswdExpire: e.target.checked}))} 
                    className="rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" 
                   />
                   <span>Expire passwords (force change on login)</span>
               </label>
               <Button onClick={addChpasswdUser} variant="success">Add Update</Button>
           </div>
        </div>
      )}

      {/* Lists */}
      <div className="space-y-4">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-bold">Configured Users</h4>
          {state.users.length === 0 && state.chpasswdUsers.length === 0 && <p className="text-sm text-gray-500 italic">No users configured.</p>}
          
          <div className="space-y-2">
             {state.users.map((u, i) => (
                 <Card 
                    key={i} 
                    title={<span className="text-cyan-400">Create: {u.name}</span>}
                    onRemove={() => setState(s => ({...s, users: s.users.filter((_, idx) => idx !== i)}))}
                    onEdit={() => handleEditUser(i)}
                 >
                     <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                         {u.sudo && <span className="bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded">Sudo</span>}
                         {u.passwd && <span className="bg-green-900 text-green-200 px-2 py-0.5 rounded">Passwd Set</span>}
                         {u.ssh_authorized_keys && <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded">{u.ssh_authorized_keys.length} Keys</span>}
                         {u.groups && u.groups.length > 0 && <span className="bg-purple-900 text-purple-200 px-2 py-0.5 rounded">Groups: {u.groups.join(', ')}</span>}
                     </div>
                 </Card>
             ))}
             
             {state.chpasswdUsers.map((u, i) => (
                 <Card 
                    key={`ch-${i}`} 
                    title={<span className="text-green-400">Update: {u.name}</span>}
                    onRemove={() => setState(s => ({...s, chpasswdUsers: s.chpasswdUsers.filter((_, idx) => idx !== i)}))}
                    onEdit={() => handleEditChpasswd(i)}
                 >
                      <div className="text-xs text-gray-400 mt-1">
                          Password: {u.password.substring(0, 10)}...
                      </div>
                 </Card>
             ))}
          </div>
      </div>
    </div>
  );
};