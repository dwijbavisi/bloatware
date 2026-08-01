# Containerized Development Environment


## The Thought Process & Motivation
I have known the basics of Docker for a while. During my bachelor's degree,
I took a course on microservices where we built images, ran containers and
executed CLI commands. It was fun academically, but it never stuck.

Why? Because I owned, and still own, a 8-year-old Dell laptop with only 6 GiB of
RAM. Running a heavy Docker VM on Windows consumed 5 GiB of RAM idle just to sit
there. As a student running programs as root, Docker felt like operational overhead.

Recently, I started diving into **Linux System Security** - exploring kernel
primitives like DAC, Mandatory Access Control (MAC), Linux Capabilities,
SELinux, Namespaces, Control Groups et cetera.

And, I also happen to have a spare Raspberry Pi 5. I purchased one some time
back, without thinking of any immediate use case.

Today's thought experiment brought me to a practical security question:
*Where does container technology fit into my personal software development workflow?*


## Linux Security

If you are reading this blog for the first time and Linux security sounds like
alien jargon, here is what the kernel actually does under the hood to isolate
processes:

- **Namespaces (blindfolds)**: Linux namespaces restrict what a process
  can see. A process in its own PID namespace thinks it is the only process
  running on the machine. A Mount namespace prevents it from seeing host files.
- **Control Groups / cgroups (resource limits)**: `cgroups` restrict how
  much CPU, memory or disk I/O a process can consume. It keeps a rogue script
  from freezing the host system.
- **Linux Capabilities (granular root)**: Historically, `root` could do
  everything. But modern Linux splits `root` into ~40 capabilities (like
  `CAP_NET_RAW` or `CAP_SYS_ADMIN`). Stripping capabilities ensures even a root
  process cannot tamper with the host kernel.
- **Secure Compute Model / seccomp (syscall firewall)**: Filters which of the
  ~450 Linux system calls (`open`, `read`, `ptrace`, `reboot` et cetera) a
  process is allowed to execute.


## Use Case: Supply Chain Risks

When I inspect my own project, `bloatware`, I see over 107 direct and indirect
npm dependencies. Every time I run `npm install` or `npm run dev` natively,
every single package (and its sneaky `postinstall` scripts) executes with full
permissions. They can read my SSH keys, browser data, files or any secrets.

Not like I have anything to be worried about anyway; even modern malware
would probably struggle to execute smoothly inside 6 GiB of RAM, but security
is good to have.

By shifting my development runtime into an isolated Linux container, I gain
three core reliefs:

1. **Cleanliness**: Zero `node_modules`, tools or build artifacts reside on
   my host laptop disk. Everything stays inside isolated containers.
2. **Setup Portability**: My entire development environment is frozen in a
   reproducible container image. If I ever buy a new laptop, less likely to
   happen than a malware attack, I can start working in seconds without having
   to install git, nodejs, python3, et cetera.
3. **Untrusted Code Sandbox**: I can clone untrusted GitHub repositories without
   fearing malicious scripts exfiltrating my laptop. Not all my friends are
   quite as "security-aware" as I now pretend to be. Containerization is
   important if I want to clone their repositories.


## Why Docker/Podman over "Raw" Linux Primitives?
This is where my extremism kicks in.

If Linux already gives me `unshare`, `chroot`, `cgroups` and `capabilities`,
why not write a custom 50-line Bash script to build my own container toolchain?

I did a little research of my own. And reached following conclusion:
While Linux provides the raw **isolation mechanics**, Docker and
Podman provide the **developer orchestration layer**:

* **Layered Image Filesystems (OverlayFS)**: Linux kernel gives you `chroot`,
  but Docker gives you copy-on-write image layering. You can share a base image
  across 10 projects without struggling with linux commands.
* **OCI Standard & Ecosystem**: Docker/Podman pack dependencies into portable
  OCI images that run identically anywhere.
* **IDE & Toolchain Integration**: Editors like VS Code expect a standard CLI
  (Docker/Podman API) to attach remote debuggers, mount volumes and forward
  ports seamlessly.


## The Architecture: Main Laptop vs. Compute Module

To achieve this, the architecture that I have in my mind, is split between a
lightweight host and a dedicated compute module (such as a spare Raspberry Pi):

```
/---------------------------------------------------------------------------\
|                       MAIN LAPTOP (Workstation Host)                      |
|                                                                           |
|  - Lightweight Editor UI (VS Code)                                        |
|  - Standard SSH Client                                                    |
\-------------------------------------T-------------------------------------/
                                      |
                         Secure SSH Connection (Port 22)
                                      |
                                      v
/---------------------------------------------------------------------------\
|                   COMPUTE MODULE (Raspberry Pi / Remote Host)             |
|                                                                           |
|  - Linux OS + sshd daemon                                                 |
|  - Container Engine (Docker / Podman)                                     |
|  |                                                                        |
|  \-> ISOLATED DEV CONTAINER SANDBOX                                       |
|      - Holds Node.js, npm, TypeScript, & project dependencies             |
|      - Non-root execution (UID 1000) & dropped Linux Capabilities         |
|      - Memory capped via cgroups (e.g. 512M)                              |
\---------------------------------------------------------------------------/
```

The IDE on the main laptop connects securely over SSH, while all file
operations, dependency installs, language servers and build scripts execute
entirely inside the isolated container on the compute module.


---

- **Author**: Dwij Bavisi <<dwij.bavisi@crabwire.net>>
- **Published**: August 01, 2026, Project bloatware
- **Conceived**: August 01, 2026
