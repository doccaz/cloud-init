import { AppState } from "../types";
// @ts-ignore
import { load, dump } from 'js-yaml';

export const generateConfigObject = (state: AppState) => {
  const config: any = {};

  // Global options
  if (state.hostname) config.hostname = state.hostname;
  if (state.manageHosts) config.manage_etc_hosts = true;
  if (state.ssh_pwauth !== true) config.ssh_pwauth = state.ssh_pwauth; // Only write if false (common usage) or explicit
  if (state.package_update) config.package_update = true;
  if (state.global_ssh_keys.length > 0) config.ssh_authorized_keys = state.global_ssh_keys;

  // Users
  if (state.users.length > 0) {
    config.users = state.users.map(u => {
      // Filter out empty optional fields
      const user: any = { ...u };
      Object.keys(user).forEach(key => {
        if (user[key] === undefined || user[key] === '' || user[key] === null) {
          delete user[key];
        }
      });
      // Handle array filtering
      if (user.groups && user.groups.length === 0) delete user.groups;
      if (user.ssh_authorized_keys && user.ssh_authorized_keys.length === 0) delete user.ssh_authorized_keys;
      return user;
    });
  }

  // Chpasswd (Update Passwords)
  if (state.chpasswdUsers.length > 0) {
    // chpasswd module expects a 'list' string with "user:password" format
    const list = state.chpasswdUsers.map(u => `${u.name}:${u.password}`).join('\n');
    config.chpasswd = {
      list: list,
      expire: state.chpasswdExpire
    };
  } else if (state.chpasswdExpire) {
      config.chpasswd = { expire: true };
  }

  // Groups
  if (state.groups.length > 0) {
    config.groups = state.groups;
  }

  // Packages
  if (state.packages.length > 0) {
    config.packages = state.packages;
  }

  // Files
  if (state.files.length > 0) {
    config.write_files = state.files.map(f => {
       const file: any = { ...f };
       if (!file.encoding || file.encoding === 'plain') delete file.encoding;
       return file;
    });
  }

  // RunCMD
  if (state.runcmd.length > 0) {
    config.runcmd = state.runcmd.map(cmd => {
      // Try to parse array syntax (e.g. ["systemctl", "enable"]) to support list-format commands
      try {
        const trimmed = cmd.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // Not valid list syntax, treat as string
      }
      return cmd;
    });
  }

  // BootCMD
  if (state.bootcmd.length > 0) {
    config.bootcmd = state.bootcmd.map(cmd => {
      try {
        const trimmed = cmd.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
           const parsed = JSON.parse(trimmed);
           if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) { }
      return cmd;
    });
  }

  // Network
  if (state.networkVersion === 'v1' && state.networkV1.length > 0) {
    config.network = {
      version: 1,
      config: state.networkV1
    };
  } else if (state.networkVersion === 'v2' && state.networkV2Yaml.trim()) {
    try {
      // Parse the custom YAML block for network v2
      const netConfig = load(state.networkV2Yaml);
      if (netConfig && typeof netConfig === 'object') {
          config.network = netConfig;
      } else {
          config.network = { __warning: "Network V2 YAML must be an object/dictionary" };
      }
    } catch (e) {
       config.network = { __warning: "Could not parse Network V2 YAML" };
    }
  }

  return config;
};

export const generateYaml = (config: any): string => {
  if (Object.keys(config).length === 0) {
    return "#cloud-config\n\n# --- Add modules to generate config ---";
  }
  try {
    return "#cloud-config\n" + dump(config, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
    });
  } catch (e: any) {
    return "Error generating Config:\n" + e.message;
  }
};

const validateSchema = (data: any): string[] => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ["Root must be a YAML object (dictionary)."];
  }

  if (data.users && !Array.isArray(data.users)) errors.push("'users' must be a list.");
  if (data.groups && !Array.isArray(data.groups)) errors.push("'groups' must be a list.");
  if (data.packages && !Array.isArray(data.packages)) errors.push("'packages' must be a list.");
  if (data.write_files && !Array.isArray(data.write_files)) errors.push("'write_files' must be a list.");
  if (data.runcmd && !Array.isArray(data.runcmd)) errors.push("'runcmd' must be a list.");
  if (data.bootcmd && !Array.isArray(data.bootcmd)) errors.push("'bootcmd' must be a list.");
  if (data.ssh_authorized_keys && !Array.isArray(data.ssh_authorized_keys)) errors.push("'ssh_authorized_keys' must be a list.");
  
  if (data.ssh_pwauth !== undefined && typeof data.ssh_pwauth !== 'boolean' && typeof data.ssh_pwauth !== 'string' && typeof data.ssh_pwauth !== 'number') {
      errors.push("'ssh_pwauth' should be a boolean.");
  }
  
  if (data.package_update !== undefined && typeof data.package_update !== 'boolean') {
      errors.push("'package_update' should be a boolean.");
  }

  return errors;
};

export const parseYaml = (yamlStr: string): AppState => {
  let data: any;
  try {
    data = load(yamlStr);
  } catch (e: any) {
    throw new Error(`YAML Parse Error: ${e.message}`);
  }

  const errors = validateSchema(data);
  if (errors.length > 0) {
    throw new Error(`Schema Validation Failed:\n- ${errors.join('\n- ')}`);
  }

  // Helper to ensure array
  const asArray = (val: any) => Array.isArray(val) ? val : [];

  // Helper to process command lists (runcmd/bootcmd)
  const processCmdList = (list: any[]) => {
      return list.map((c: any) => {
          if (Array.isArray(c)) {
              return JSON.stringify(c);
          }
          if (typeof c === 'string') return c;
          return JSON.stringify(c);
      });
  };

  // Default State with mapped values
  const newState: AppState = {
      users: asArray(data.users).map((u: any) => ({
          ...u,
          groups: Array.isArray(u.groups) ? u.groups : (typeof u.groups === 'string' ? u.groups.split(',') : []),
          ssh_authorized_keys: Array.isArray(u.ssh_authorized_keys) ? u.ssh_authorized_keys : []
      })),
      chpasswdUsers: [],
      chpasswdExpire: false,
      groups: asArray(data.groups),
      packages: asArray(data.packages),
      package_update: !!data.package_update,
      files: asArray(data.write_files).map((f: any) => ({
          path: f.path || '',
          content: f.content || '',
          permissions: f.permissions,
          owner: f.owner,
          encoding: f.encoding
      })),
      runcmd: processCmdList(asArray(data.runcmd)),
      bootcmd: processCmdList(asArray(data.bootcmd)),
      hostname: data.hostname || '',
      manageHosts: !!data.manage_etc_hosts,
      networkVersion: 'v2', 
      networkV1: [],
      networkV2Yaml: '',
      ssh_pwauth: data.ssh_pwauth !== undefined ? (String(data.ssh_pwauth) === 'true' || data.ssh_pwauth === 1) : true,
      global_ssh_keys: asArray(data.ssh_authorized_keys)
  };

  // chpasswd logic
  if (data.chpasswd) {
      if (typeof data.chpasswd === 'object') {
          newState.chpasswdExpire = !!data.chpasswd.expire;
          
          if (typeof data.chpasswd.list === 'string') {
              const lines = data.chpasswd.list.split('\n');
              newState.chpasswdUsers = lines.map((line: string) => {
                  const parts = line.split(':');
                  if (parts.length >= 2) {
                      return { name: parts[0], password: parts.slice(1).join(':') };
                  }
                  return null;
              }).filter((x: any) => x) as any;
          } 
          else if (Array.isArray(data.chpasswd.users)) {
             newState.chpasswdUsers = data.chpasswd.users.map((u: any) => ({
                 name: u.name,
                 password: u.password
             })).filter((u: any) => u.name && u.password);
          }
      }
  }

  // Network logic
  if (data.network) {
      if (data.network.version === 1) {
          newState.networkVersion = 'v1';
          newState.networkV1 = data.network.config || [];
      } else {
          newState.networkVersion = 'v2';
          // Now we can simply dump the object back to YAML string for editing
          newState.networkV2Yaml = dump(data.network, { indent: 2, flowLevel: -1 });
      }
  }

  return newState;
};