"""
Terminal GUI Prompts — Python adapter.
Uses the TGP core binary when available; falls back to terminal input.
"""

from ._tgp import confirm, prompt, has_tgp_binary

__all__ = ["confirm", "prompt", "has_tgp_binary"]
