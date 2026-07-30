/**
 * Terminal GUI Prompts — C adapter.
 * Uses the TGP core binary when available; falls back to terminal (stdin).
 * Works in CLI, Electron, and Tauri when TGP_BIN is set.
 */
#ifndef TGP_H
#define TGP_H

#ifdef __cplusplus
extern "C" {
#endif

/** Options for confirm (yes/no). default_yes=1 means default is Yes. */
typedef struct tgp_confirm_opts {
  const char *message;
  const char *title;   /* may be NULL, then "Confirm" */
  int default_yes;     /* 1 = yes, 0 = no */
  int force_terminal;  /* 1 = never use GUI */
} tgp_confirm_opts_t;

/** Options for text input prompt. */
typedef struct tgp_prompt_opts {
  const char *message;
  const char *title;   /* may be NULL, then "Input" */
  const char *default_value; /* may be NULL */
  int force_terminal;
} tgp_prompt_opts_t;

/**
 * Confirm: writes message to stdout, then runs TGP or reads from stdin.
 * Returns 1 for yes, 0 for no. On error returns -1 and errno set.
 */
int tgp_confirm(const tgp_confirm_opts_t *opts);

/**
 * Prompt: writes message to stdout, then runs TGP or reads from stdin.
 * Returns a newly allocated string (caller must free), or NULL on error/cancel.
 */
char *tgp_prompt(const tgp_prompt_opts_t *opts);

/** Returns 1 if the TGP binary is available. */
int tgp_has_binary(void);

#ifdef __cplusplus
}
#endif

#endif
