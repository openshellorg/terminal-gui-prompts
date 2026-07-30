#define _POSIX_C_SOURCE 200809L
#include "tgp.h"
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#ifdef _WIN32
#include <process.h>
#define popen _popen
#define pclose _pclose
#endif

static const char *tgp_bin(void) {
  const char *env = getenv("TGP_BIN");
  if (env && access(env, X_OK) == 0) return env;
  return NULL;
}

int tgp_has_binary(void) {
  if (tgp_bin()) return 1;
  /* When TGP_BIN not set, assume "tgp" might be in PATH; run_tgp will try it */
  return 1;
}

static int run_tgp(const char **argv, char *out, size_t out_size, int *exit_code) {
  const char *bin = tgp_bin();
  if (!bin) bin = "tgp";
  char cmd[4096];
  size_t n = (size_t)snprintf(cmd, sizeof(cmd), "\"%s\" ", bin);
  for (int i = 0; argv[i] && n < sizeof(cmd) - 64; i++)
    n += (size_t)snprintf(cmd + n, sizeof(cmd) - n, "\"%s\" ", argv[i]);
  FILE *f = popen(cmd, "r");
  if (!f) return -1;
  if (!fgets(out, (int)out_size, f)) out[0] = '\0';
  *exit_code = pclose(f);
  return 0;
}

int tgp_confirm(const tgp_confirm_opts_t *opts) {
  if (!opts || !opts->message) { errno = EINVAL; return -1; }
  printf("%s\n", opts->message);
  fflush(stdout);
  const char *title = opts->title ? opts->title : "Confirm";
  const char *def = opts->default_yes ? "yes" : "no";
  if (!opts->force_terminal && tgp_has_binary()) {
    const char *argv[] = { "confirm", "--message", opts->message, "--title", title, "--default", def, NULL };
    char line[32];
    int code;
    if (run_tgp(argv, line, sizeof(line), &code) == 0) {
      if (line[0] == 'y' || line[0] == 'Y') return 1;
      if (line[0] == 'n' || line[0] == 'N') return 0;
    }
  }
  printf("%s ", opts->default_yes ? "(Y/n) " : "(y/N) ");
  fflush(stdout);
  char buf[32];
  if (!fgets(buf, sizeof(buf), stdin)) return opts->default_yes ? 1 : 0;
  if (buf[0] == 'y' || buf[0] == 'Y') return 1;
  if (buf[0] == 'n' || buf[0] == 'N') return 0;
  return opts->default_yes ? 1 : 0;
}

char *tgp_prompt(const tgp_prompt_opts_t *opts) {
  if (!opts || !opts->message) { errno = EINVAL; return NULL; }
  printf("%s\n", opts->message);
  fflush(stdout);
  const char *title = opts->title ? opts->title : "Input";
  const char *def = opts->default_value ? opts->default_value : "";
  if (!opts->force_terminal && tgp_has_binary()) {
    const char *argv[] = { "input", "--message", opts->message, "--title", title, "--default", def, NULL };
    char line[2048];
    int code;
    if (run_tgp(argv, line, sizeof(line), &code) == 0 && code == 0) {
      line[strcspn(line, "\r\n")] = '\0';
      return strdup(line);
    }
  }
  if (opts->default_value && opts->default_value[0])
    printf(" (default: %s) ", opts->default_value);
  else
    printf(" ");
  fflush(stdout);
  char *buf = malloc(2048);
  if (!buf) return NULL;
  if (!fgets(buf, 2048, stdin)) { free(buf); return NULL; }
  buf[strcspn(buf, "\r\n")] = '\0';
  if (buf[0] == '\0' && opts->default_value) {
    free(buf);
    return strdup(opts->default_value);
  }
  return buf;
}
