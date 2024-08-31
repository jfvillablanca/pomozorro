{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devenv.url = "github:cachix/devenv";
  };

  outputs = {
    self,
    nixpkgs,
    devenv,
    flake-utils,
    ...
  } @ inputs:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
      };
    in {
      devShells.default = devenv.lib.mkShell {
        inherit inputs pkgs;
        modules = [
          {
            languages = {
              nix.enable = true;
              javascript = {
                enable = true;
                pnpm = {
                  package = pkgs.pnpm.overrideAttrs (finalAttrs: _prevAttrs: {
                    version = "9.9.0";
                    src = pkgs.fetchurl {
                      url = "https://registry.npmjs.org/pnpm/-/pnpm-${finalAttrs.version}.tgz";
                      hash = "sha256-ekJh5Q2aRNkkC69snW4QCJ3PCnnQAH8qJphaaScyQXc=";
                    };
                  });
                  enable = true;
                };
              };
            };
            packages = with pkgs; [nil statix deadnix alejandra];
          }
        ];
      };
    });
}
