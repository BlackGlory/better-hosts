# better-hosts
Dead simple DNS server using syntax similar to hosts file.

## Motivations
hosts works well, until:
1. you need wildcard-based rules like `127.0.0.1 *.local-service`.
2. you need ban rules like `-example.com`.
3. you need to share records in the hosts file to other devices.
4. you don't want to have to request administrator or root privileges every time you edit it.

better-hosts solves these problems by creating a DNS server that uses the hosts file.

## Install
```sh
# Please do not use Yarn v1 to install this package globally, Yarn v1 cannot properly patch dependencies.
npm install --global better-hosts
```

## Usage
```sh
Usage: better-hosts [options] <filename>

Options:
  -V, --version               output the version number
  --fallback-server <server>
  --port [port]                (default: "53")
  --log [level]                (default: "info")
  -h, --help                  display help for command
```

Example:
```sh
better-hosts hosts.txt \
  --port 5353 \
  --fallback-server=1.1.1.1:53
```
