import {MsEdgeTTS, OUTPUT_FORMAT, Voice} from "../";
import {Readable} from "stream";
import * as tmp from 'tmp';
import * as fs from 'fs';

describe("MsEdgeTTS", () => {
    describe("toStream", () => {
        it("should return a readable stream", (done) => {
            const tts = new MsEdgeTTS();
            tts.setMetadata(
                "en-IE-ConnorNeural",
                OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
            ).then(() => {
                const input = "Hello, world!";
                const outputReadable = tts.toStream(input);
                expect(outputReadable).toBeInstanceOf(require("stream").Readable);

                outputReadable.on("data", (data) => {
                    console.log("" + new Date() + " --> DATA RECEIVED", data.length);
                    // raw audio file data
                });

                outputReadable.on("close", () => {
                    console.log("" + new Date() + " --> STREAM CLOSED");
                    done();
                });

                // Listen to the 'end' event
                outputReadable.on('end', () => {
                    console.log('end No more data.');
                });

                // Listen to the 'error' event
                outputReadable.on('error', (err) => {
                    console.error('An error occurred:', err);
                    done();
                });
            });

        }, 10000);

        it("concurrent two readable stream", (done) => {
            const tts = new MsEdgeTTS();
            tts.setMetadata(
                "en-IE-ConnorNeural",
                OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
            ).then(() => {
                const input = "Hello, world!";
                const outputReadable1 = tts.toStream("this is stream1");
                const outputReadable2 = tts.toStream("this is stream2");
                expect(outputReadable1).toBeInstanceOf(Readable);
                expect(outputReadable2).toBeInstanceOf(Readable);

                outputReadable1.on("data", (data) => {
                        // console.log("" + new Date() + " --> DATA RECEIVED", data.length);
                        // raw audio file data
                    }
                );

                outputReadable2.on("data", (data) => {
                    // console.log("" + new Date() + " --> DATA RECEIVED", data.length);
                    // raw audio file data
                });

                let count = 0;
                outputReadable1.on("close", () => {
                    console.log("" + new Date() + " --> STREAM1 CLOSED");
                    count += 1;
                    if (count === 2) {
                        done();
                    }
                });
                outputReadable2.on("close", () => {
                    console.log("" + new Date() + " --> STREAM2 CLOSED");
                    count += 1;
                    if (count === 2) {
                        done();
                    }
                });
            });

        }, 10000);
    });

    describe("getVoices", () => {
        it("getVoices", async () => {
            const tts = new MsEdgeTTS();
            const voices = await tts.getVoices();
            expect(voices).toBeDefined();
            expect(voices.length).toBeGreaterThan(0);
        }, 5000);
    });

    describe("toFile", () => {
        it("should return a file path", (done) => {
            const tts = new MsEdgeTTS();
            tts.setMetadata(
                "en-IE-ConnorNeural",
                OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
            ).then(() => {
                const input = "Hello, world!";
                const fileName = input.replace(/[^a-zA-Z]/g, '_');
                tmp.file({name: `${fileName}.ogg`}, (err, path, fd, cleanupCallback) => {
                    console.log('File: ', path);
                    tts.toFile(path, input).then((outputFilePath) => {
                        // expect file size of path should be greater than 0;
                        expect(fs.statSync(path).size).toBeGreaterThan(0);

                        try {
                            fs.unlinkSync(path);
                            console.log('File deleted successfully');
                        } catch (err) {
                            console.error('An error occurred:', err);
                        }
                        done();
                    });
                });
            });
        }, 10000);

        it.only("should return a file path", async () => {
            const tts = new MsEdgeTTS();
            await tts.setMetadata(
                "en-IE-ConnorNeural",
                OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
            );
            const tasks = [];
            // randomly generate 10 inputs to test concurrency
            for (let i = 0; i < 10; i++) {
                // generate random sentence
                const input = Math.random().toString(36).substring(7);
                const fileName = input.replace(/[^a-zA-Z]/g, '_');
                const file = tmp.fileSync({name: `${fileName}_${i}.ogg`});
                const {name: path} = file;
                console.log(`inputs[${i}] ${path} start`);
                const p = tts.toFile(path, input).then((outputFilePath) => {
                    console.log(`inputs[${i}] ${path} done`);
                    try {
                        fs.unlinkSync(path);
                        console.log('File deleted successfully');
                    } catch (err) {
                        console.error('An error occurred:', err);
                    }
                });
                tasks.push(p);
            }
            await Promise.all(tasks);
        }, 10000);
    });
})
;
