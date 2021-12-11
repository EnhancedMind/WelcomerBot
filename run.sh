#!/bin/bash

node .

# if you have armv6l cpu on your server and are getting error that armv6l is not supported,
# use the following command by uncommenting (removing #) the following line and commenting 3rd
#node --no-expose-wasm .