{
  "targets": [
    {
      "target_name": "node_rpi",
      "include_dirs": [ "<!(node -e \"require('nan')\")" ],
      "sources": [
        "src/rpi.c", 
        "src/node_rpi.cc", 
      ],
      "cflags": [ "-Wno-cast-function-type" ],
    }
  ]
}
