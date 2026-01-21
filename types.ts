export interface User {
  name: string;
  gecos?: string;
  shell?: string;
  primary_group?: string;
  groups?: string[];
  passwd?: string;
  plain_text_passwd?: string;
  ssh_authorized_keys?: string[];
  expiredate?: string;
  inactive?: number;
  sudo?: string | boolean;
  lock_passwd?: boolean;
  system?: boolean;
}

export interface ChpasswdUser {
  name: string;
  password: string;
}

export interface Group {
  name: string;
  members?: string[];
}

export interface FileConfig {
  path: string;
  permissions?: string;
  owner?: string;
  content?: string;
  encoding?: 'plain' | 'b64';
}

export interface NetworkV1Route {
  network: string;
  netmask: string;
  gateway: string;
  metric?: number;
}

export interface NetworkV1Subnet {
  type: 'dhcp' | 'static' | 'dhcp4' | 'dhcp6';
  address?: string;
  netmask?: string;
  gateway?: string;
  dns_nameservers?: string[];
  routes?: NetworkV1Route[];
}

export interface NetworkV1Interface {
  name: string;
  type: 'physical' | 'bond' | 'vlan';
  mac_address?: string;
  subnets: NetworkV1Subnet[];
}

export interface AppState {
  users: User[];
  chpasswdUsers: ChpasswdUser[];
  chpasswdExpire: boolean;
  groups: (Group | string)[];
  packages: string[];
  package_update: boolean;
  files: FileConfig[];
  runcmd: string[];
  bootcmd: string[];
  hostname: string;
  manageHosts: boolean;
  networkVersion: 'v1' | 'v2';
  networkV1: NetworkV1Interface[];
  networkV2Yaml: string;
  ssh_pwauth: boolean;
  global_ssh_keys: string[];
}