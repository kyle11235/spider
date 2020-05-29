SHELL_DIR=$(dirname "$BASH_SOURCE")
APP_DIR=$(cd $SHELL_DIR; pwd)

node $APP_DIR/index.js > out.log 2>&1 &