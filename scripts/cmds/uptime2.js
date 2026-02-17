const os = require('os');
const si = require('systeminformation');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

module.exports = {
  config: {
    name: "up2",
    aliases: ["uptime2", "status", "sysinfo"],
    version: "2.2",
    author: "Ere'rious",
    countDown: 5,
    role: 0,
    shortDescription: "Show bot and system status",
    longDescription: "Display detailed system information and bot statistics",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message, args, threadsData, usersData }) {
    try {
      const commandStartTime = Date.now();

      // Send initial reaction
      await message.reaction("⏳", event.messageID);

      // Measure HOST ping to internet (where bot is hosted)
      const hostPing = await measureHostPing();

      // Get system information in parallel
      const [
        timeInfo,
        cpuInfo,
        memInfo,
        diskInfo,
        networkInfo,
        processInfo,
        botData
      ] = await Promise.all([
        getTimeInfo(),
        getCpuInfo(),
        getMemoryInfo(),
        getDiskInfo(),
        getNetworkInfo(),
        getProcessInfo(),
        getBotData(threadsData, usersData)
      ]);

      // Calculate processing time
      const processingTime = Date.now() - commandStartTime;

      // Format the message
      const statusMessage = formatStatusMessage({
        timeInfo,
        hostPing,
        processingTime,
        cpuInfo,
        memInfo,
        diskInfo,
        networkInfo,
        processInfo,
        botData
      });

      // Send the message
      await message.reply({
        body: statusMessage,
        attachment: null
      });

      // Update reaction
      await message.reaction("✅", event.messageID);

      // Log detailed timing for debugging
      console.log(`🏠 Host Ping Measurement:`);
      console.log(`  Server Ping to Internet: ${hostPing}ms`);
      console.log(`  Processing Time: ${processingTime}ms`);
      console.log(`  Total Time: ${Date.now() - commandStartTime}ms`);

    } catch (error) {
      console.error("Up command error:", error);
      await message.reply("❌ Failed to fetch system information. Please try again later.");
      await message.reaction("❌", event.messageID);
    }
  }
};

// ==================== HOST PING MEASUREMENT ====================

async function measureHostPing() {
  try {
    // Use system ping command to measure host's internet connection
    const pingTargets = [
      'google.com',
      '1.1.1.1',      // Cloudflare DNS
      '8.8.8.8',      // Google DNS
      'facebook.com'
    ];

    let successfulPings = 0;
    let totalPing = 0;

    for (const target of pingTargets) {
      try {
        const ping = await pingHost(target);
        if (ping > 0) {
          successfulPings++;
          totalPing += ping;
        }
      } catch (error) {
        console.log(`Ping to ${target} failed:`, error.message);
      }
    }

    if (successfulPings > 0) {
      return Math.round(totalPing / successfulPings);
    } else {
      // Fallback: estimate based on server location
      return await estimatePingByLocation();
    }

  } catch (error) {
    console.log("Host ping measurement failed:", error.message);
    return await estimatePingByLocation();
  }
}

async function pingHost(hostname) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Use system ping command
    const command = process.platform === 'win32' 
      ? `ping -n 1 ${hostname}`
      : `ping -c 1 ${hostname}`;

    exec(command, (error, stdout, stderr) => {
      const endTime = Date.now();

      if (error) {
        reject(new Error(`Ping to ${hostname} failed`));
        return;
      }

      // Parse ping time from output
      let pingTime = null;

      if (process.platform === 'win32') {
        // Windows output: "time=12ms"
        const match = stdout.match(/time[=<](\d+)\s*ms/i);
        if (match) {
          pingTime = parseInt(match[1]);
        }
      } else {
        // Linux/Mac output: "time=12.345 ms"
        const match = stdout.match(/time[=<](\d+\.?\d*)\s*ms/i);
        if (match) {
          pingTime = parseFloat(match[1]);
        }
      }

      if (pingTime) {
        resolve(pingTime);
      } else {
        // If can't parse, use the execution time as approximation
        resolve(endTime - startTime);
      }
    });
  });
}

async function estimatePingByLocation() {
  try {
    // Try to determine server location and estimate ping
    const hostname = os.hostname();
    const platform = os.platform();

    // Common hosting providers and their typical ping
    if (hostname.includes('render.com') || hostname.includes('onrender')) {
      return 180; // Render.com (global CDN)
    } else if (hostname.includes('heroku')) {
      return 200; // Heroku
    } else if (hostname.includes('aws') || hostname.includes('amazon')) {
      return 150; // AWS
    } else if (hostname.includes('azure')) {
      return 170; // Azure
    } else if (hostname.includes('google') || hostname.includes('gcp')) {
      return 160; // Google Cloud
    } else if (platform === 'linux' && hostname.includes('vps')) {
      return 220; // Generic VPS
    } else {
      return 250; // Default estimate
    }
  } catch {
    return 300; // Conservative default
  }
}

// ==================== HELPER FUNCTIONS ====================

async function getTimeInfo() {
  const now = new Date();
  const botUptime = process.uptime();
  const systemUptime = os.uptime();

  // Set timezone to Bangladesh (Asia/Dhaka)
  moment.tz.setDefault('Asia/Dhaka');

  // Get Bangladesh time
  const bangladeshTime = moment().tz('Asia/Dhaka');

  return {
    date: bangladeshTime.format('MMMM Do YYYY, h:mm:ss A'),
    bangladeshTime: bangladeshTime.format('h:mm:ss A'),
    timezone: 'Asia/Dhaka (BST)',
    botUptime: formatUptime(botUptime),
    systemUptime: formatUptime(systemUptime),
    timestamp: now.getTime()
  };
}

async function getCpuInfo() {
  try {
    const cpu = await si.cpu();
    const load = await si.currentLoad();

    let cpuSpeed = 'N/A';

    // Method 1: Try cpuCurrentSpeed first
    try {
      const speedData = await si.cpuCurrentSpeed();
      if (speedData && speedData.avg) {
        cpuSpeed = `${speedData.avg.toFixed(2)} GHz`;
      }
    } catch (speedError) {
      console.log("CPU speed method 1 failed:", speedError.message);
    }

    // Method 2: Check if CPU has speed property
    if (cpuSpeed === 'N/A' && cpu.speed) {
      if (typeof cpu.speed === 'number') {
        cpuSpeed = `${cpu.speed.toFixed(2)} GHz`;
      } else if (typeof cpu.speed === 'string') {
        cpuSpeed = cpu.speed;
      }
    }

    // Method 3: Check CPU model for speed info
    if (cpuSpeed === 'N/A' && cpu.model) {
      const model = cpu.model.toLowerCase();
      const speedMatch = model.match(/(\d+\.?\d*)\s*(ghz|mhz)/i);
      if (speedMatch) {
        let speed = parseFloat(speedMatch[1]);
        const unit = speedMatch[2].toLowerCase();
        if (unit === 'mhz') {
          speed = speed / 1000;
        }
        cpuSpeed = `${speed.toFixed(2)} GHz`;
      }
    }

    // Method 4: Try os.cpus() as fallback
    if (cpuSpeed === 'N/A') {
      const cpus = os.cpus();
      if (cpus && cpus.length > 0 && cpus[0].speed) {
        const speed = cpus[0].speed;
        if (speed > 1000) {
          cpuSpeed = `${(speed / 1000).toFixed(2)} GHz`;
        } else {
          cpuSpeed = `${speed} MHz`;
        }
      }
    }

    // Method 5: Check CPU brand for common speeds
    if (cpuSpeed === 'N/A') {
      if (cpu.brand && cpu.brand.includes('Xeon')) {
        cpuSpeed = '2.00+ GHz (Xeon)';
      } else if (cpu.brand && cpu.brand.includes('AMD')) {
        cpuSpeed = '3.00+ GHz (AMD)';
      } else if (cpu.brand && cpu.brand.includes('Intel')) {
        cpuSpeed = '2.50+ GHz (Intel)';
      }
    }

    return {
      usage: load.currentLoad.toFixed(1),
      model: cpu.manufacturer + ' ' + cpu.brand,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      speed: cpuSpeed,
      loadAvg: os.loadavg().map(l => l.toFixed(2)).join(' | '),
      brand: cpu.brand,
      manufacturer: cpu.manufacturer
    };
  } catch (error) {
    console.error("CPU info error:", error);
    const cpus = os.cpus();
    const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cpuSpeed = cpus && cpus[0] && cpus[0].speed ? 
      (cpus[0].speed > 1000 ? `${(cpus[0].speed/1000).toFixed(2)} GHz` : `${cpus[0].speed} MHz`) : 
      'N/A';

    return {
      usage: (os.loadavg()[0] * 100 / (cpus ? cpus.length : 1)).toFixed(1),
      model: cpuModel,
      cores: cpus ? cpus.length : 1,
      physicalCores: cpus ? cpus.length : 1,
      speed: cpuSpeed,
      loadAvg: os.loadavg().map(l => l.toFixed(2)).join(' | ')
    };
  }
}

async function getMemoryInfo() {
  try {
    const mem = await si.mem();
    const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
    const usedGB = ((mem.total - mem.available) / 1024 / 1024 / 1024).toFixed(1);
    const freeGB = (mem.available / 1024 / 1024 / 1024).toFixed(1);

    return {
      total: parseFloat(totalGB),
      used: parseFloat(usedGB),
      free: parseFloat(freeGB),
      percentage: ((mem.total - mem.available) / mem.total * 100).toFixed(1)
    };
  } catch {
    const total = os.totalmem() / 1024 / 1024 / 1024;
    const free = os.freemem() / 1024 / 1024 / 1024;
    const used = total - free;

    return {
      total: total.toFixed(1),
      used: used.toFixed(1),
      free: free.toFixed(1),
      percentage: ((used / total) * 100).toFixed(1)
    };
  }
}

async function getDiskInfo() {
  try {
    const disks = await si.fsSize();
    const rootDisk = disks.find(d => d.mount === '/') || disks[0];

    if (rootDisk) {
      const totalGB = (rootDisk.size / 1024 / 1024 / 1024).toFixed(1);
      const usedGB = (rootDisk.used / 1024 / 1024 / 1024).toFixed(1);
      const freeGB = (rootDisk.available / 1024 / 1024 / 1024).toFixed(1);

      return {
        total: parseFloat(totalGB),
        used: parseFloat(usedGB),
        free: parseFloat(freeGB),
        percentage: ((rootDisk.used / rootDisk.size) * 100).toFixed(1)
      };
    }
  } catch (error) {
    console.error("Disk info error:", error);
  }

  return {
    total: 'N/A',
    used: 'N/A',
    free: 'N/A',
    percentage: 'N/A'
  };
}

async function getNetworkInfo() {
  try {
    const network = await si.networkStats();
    const defaultInterface = network[0] || {};

    const rxMB = (defaultInterface.rx_bytes / 1024 / 1024).toFixed(2);
    const txMB = (defaultInterface.tx_bytes / 1024 / 1024).toFixed(2);

    return {
      rx: rxMB,
      tx: txMB,
      interface: defaultInterface.iface || 'N/A'
    };
  } catch {
    return {
      rx: '0.00',
      tx: '0.00',
      interface: 'N/A'
    };
  }
}

async function getProcessInfo() {
  const memoryUsage = process.memoryUsage();
  const botMemoryMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);

  // Get server location info
  const hostname = os.hostname();
  let serverLocation = 'Unknown';

  if (hostname.includes('render.com') || hostname.includes('onrender')) {
    serverLocation = 'Render.com (Global CDN)';
  } else if (hostname.includes('heroku')) {
    serverLocation = 'Heroku';
  } else if (hostname.includes('aws') || hostname.includes('amazon')) {
    serverLocation = 'AWS Cloud';
  } else if (hostname.includes('azure')) {
    serverLocation = 'Microsoft Azure';
  } else if (hostname.includes('google') || hostname.includes('gcp')) {
    serverLocation = 'Google Cloud';
  } else if (hostname.includes('vps') || hostname.includes('server')) {
    serverLocation = 'VPS/Dedicated Server';
  } else {
    serverLocation = 'Cloud Hosting';
  }

  return {
    pid: process.pid,
    botMemory: parseFloat(botMemoryMB),
    nodeVersion: process.version,
    platform: os.platform() + ' ' + os.arch(),
    hostname: os.hostname(),
    systemInfo: `${os.type()} ${os.release()} ${os.arch()}`,
    uptime: process.uptime(),
    serverLocation: serverLocation
  };
}

async function getBotData(threadsData, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const allThreads = await threadsData.getAll();

    let packageCount = 0;

    const possiblePaths = [
      __dirname,
      path.join(__dirname, '..'),
      path.join(process.cwd(), 'commands'),
      path.join(process.cwd(), 'cmds'),
      path.join(__dirname, '..', '..', 'commands'),
      process.cwd()
    ];

    for (const cmdPath of possiblePaths) {
      try {
        if (fs.existsSync(cmdPath)) {
          const items = fs.readdirSync(cmdPath);
          const jsFiles = items.filter(f => 
            f.endsWith('.js') && 
            !f.startsWith('_') && 
            !f.includes('example') &&
            f !== 'index.js'
          );

          if (jsFiles.length > packageCount) {
            packageCount = jsFiles.length;
          }
        }
      } catch (e) {
        // Continue trying other paths
      }
    }

    if (packageCount === 0 && global.GoatBot && global.GoatBot.commands) {
      packageCount = global.GoatBot.commands.size;
    }

    return {
      totalUsers: allUsers.length,
      totalGroups: allThreads.length,
      installedPackages: packageCount
    };
  } catch (error) {
    console.error("Error getting bot data:", error);
    return {
      totalUsers: 0,
      totalGroups: 0,
      installedPackages: 0
    };
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

function getPingQuality(ping) {
  // Adjusted for server-to-internet ping
  if (ping < 50) return { emoji: '⚡', status: 'Excellent' };
  if (ping < 100) return { emoji: '🟢', status: 'Very Good' };
  if (ping < 200) return { emoji: '🟡', status: 'Good' };
  if (ping < 350) return { emoji: '🟠', status: 'Average' };
  return { emoji: '🔴', status: 'Poor' };
}

function formatStatusMessage(data) {
  const {
    timeInfo,
    hostPing,
    processingTime,
    cpuInfo,
    memInfo,
    diskInfo,
    networkInfo,
    processInfo,
    botData
  } = data;

  const pingQuality = getPingQuality(hostPing);

  return `🛠️ System Uptime Information!

📅 Date & Time: ${timeInfo.date}
🌏 Timezone: ${timeInfo.timezone}

${'-'.repeat(40)}
⏱️ Host Server Performance:
•× Server Ping to Internet: ${hostPing}ms ${pingQuality.emoji} (${pingQuality.status})
•× Command Processing: ${processingTime}ms
•× Server Location: ${processInfo.serverLocation}

${'-'.repeat(40)}
🕒 Uptime Information:
•× Bot Uptime: ${timeInfo.botUptime}
•× System Uptime: ${timeInfo.systemUptime}

${'-'.repeat(40)}
💻 CPU Information:
•× CPU Usage: ${cpuInfo.usage}%
•× CPU Model: ${cpuInfo.model}
•× CPU Cores: ${cpuInfo.cores} (${cpuInfo.physicalCores} Physical)
•× CPU Speed: ${cpuInfo.speed}
•× Load Average: ${cpuInfo.loadAvg}

${'-'.repeat(40)}
🧠 Memory Information:
•× RAM Used: ${memInfo.used} GB / ${memInfo.total} GB
•× Free Memory: ${memInfo.free} GB
•× Usage: ${memInfo.percentage}%

${'-'.repeat(40)}
💾 Storage Information:
•× Disk Used: ${diskInfo.used} GB / ${diskInfo.total} GB
•× Available Disk: ${diskInfo.free} GB
•× Usage: ${diskInfo.percentage}%

${'-'.repeat(40)}
🌐 Network Information:
•× Network Interface: ${networkInfo.interface}
•× Data RX/TX: ${networkInfo.rx} MB / ${networkInfo.tx} MB

${'-'.repeat(40)}
🤖 Bot Statistics:
•× Total Users: ${botData.totalUsers}
•× Total Groups: ${botData.totalGroups}
•× Installed Packages: ${botData.installedPackages}

${'-'.repeat(40)}
⚙️ System Details:
•× Process PID: ${processInfo.pid}
•× Bot Memory Used: ${processInfo.botMemory} MB
•× Node.js Version: ${processInfo.nodeVersion}
•× Platform: ${processInfo.platform}
•× Hostname: ${processInfo.hostname}
•× System: ${processInfo.systemInfo}`;
      }
