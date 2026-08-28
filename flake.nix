{
  description = "Tonosaki Seinosuke personal site (Vite + Three.js)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem
      [
        "aarch64-darwin"
        "x86_64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ]
      (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          devShells.default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_22
              pkgs.pnpm
            ];

            shellHook = ''
              echo "mysite devShell: node=$(node --version) pnpm=$(pnpm --version)"
            '';
          };
        }
      );
}
