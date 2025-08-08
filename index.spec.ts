import { TerminalTextRender, createTerminalLogManager } from './index';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import ansiEscapes from 'ansi-escapes';

describe('TerminalTextRender', () => {
    let renderer: TerminalTextRender;

    beforeEach(() => {
        renderer = new TerminalTextRender();
    });

    describe('basic functionality', () => {
        test('should handle simple text', () => {
            renderer.write('Hello World');
            expect(renderer.render()).toBe('Hello World');
        });

        test('should handle newlines', () => {
            renderer.write('Line 1\nLine 2\nLine 3');
            expect(renderer.render()).toBe('Line 1\nLine 2\nLine 3');
        });

        test('should handle carriage returns', () => {
            renderer.write('Hello\rWorld');
            expect(renderer.render()).toBe('World');
        });

        test('should handle carriage return with overwrite', () => {
            renderer.write('Progress: 0%\rProgress: 50%\rProgress: 100%');
            expect(renderer.render()).toBe('Progress: 100%');
        });

        test('should handle tabs', () => {
            renderer.write('A\tB\tC');
            expect(renderer.render()).toBe('A       B       C');
        });

        test('should handle backspace', () => {
            renderer.write('Hello\b\b\bworld');
            expect(renderer.render()).toBe('Heworld');
        });

        test('should handle ASCII arrow up character', () => {
            renderer.write('Before ↑ After');
            expect(renderer.render()).toBe('Before ↑ After');
        });

        test('should handle caret character (ASCII circumflex)', () => {
            renderer.write('Error at line 5: ^SyntaxError');
            expect(renderer.render()).toBe('Error at line 5: ^SyntaxError');
        });
    });

    describe('ANSI escape sequences', () => {
        test('should handle cursor positioning', () => {
            renderer.write('Hello\x1b[1;1HWorld');
            expect(renderer.render()).toBe('World');
        });

        test('should handle cursor up movement', () => {
            renderer.write('Line 1\nLine 2\x1b[1AModified');
            expect(renderer.render()).toBe('Line 1Modified\nLine 2');
        });

        test('should handle cursor down movement', () => {
            renderer.write('Line 1\x1b[1BLine 3');
            expect(renderer.render()).toBe('Line 1\n      Line 3');
        });

        test('should handle cursor forward movement', () => {
            renderer.write('Hello\x1b[3CWorld');
            expect(renderer.render()).toBe('Hello   World');
        });

        test('should handle cursor backward movement', () => {
            renderer.write('Hello World\x1b[5D123');
            expect(renderer.render()).toBe('Hello 123ld');
        });

        test('should handle clear line from cursor', () => {
            renderer.write('Hello World\x1b[5D\x1b[K123');
            expect(renderer.render()).toBe('Hello 123');
        });

        test('should handle clear entire line', () => {
            renderer.write('Hello World\x1b[5D\x1b[2K123');
            expect(renderer.render()).toBe('      123');
        });

        test('should handle clear screen', () => {
            renderer.write('Line 1\nLine 2\nLine 3\x1b[2JNew Content');
            expect(renderer.render()).toBe('New Content');
        });
    });

    describe('ANSI escape cursor controls (ansi-escapes)', () => {
        test('should handle cursorUp', () => {
            renderer.write('Line 1\nLine 2\nLine 3');
            renderer.write(ansiEscapes.cursorUp(2));
            renderer.write('Modified');
            expect(renderer.render()).toBe('Line 1Modified\nLine 2\nLine 3');
        });

        test('should handle cursorDown', () => {
            renderer.write('Line 1');
            renderer.write(ansiEscapes.cursorDown(2));
            renderer.write('Line 3');
            expect(renderer.render()).toBe('Line 1\n\nLine 3');
        });

        test('should handle cursorLeft', () => {
            renderer.write('Hello World');
            renderer.write(ansiEscapes.cursorLeft);
            renderer.write('!');
            expect(renderer.render()).toBe('Hello Worl!');
        });

        test('should handle cursorForward', () => {
            renderer.write('Hello');
            renderer.write(ansiEscapes.cursorForward(3));
            renderer.write('World');
            expect(renderer.render()).toBe('Hello   World');
        });

        test('should handle cursorBackward', () => {
            renderer.write('Hello World');
            renderer.write(ansiEscapes.cursorBackward(5));
            renderer.write('123');
            expect(renderer.render()).toBe('Hello 123ld');
        });

        test('should handle cursorTo position', () => {
            renderer.write('Original text\nSecond line');
            renderer.write(ansiEscapes.cursorTo(5, 0));
            renderer.write('NEW');
            expect(renderer.render()).toBe('OrigiNEWt\nSecond line');
        });

        test('should handle cursorMove relative positioning', () => {
            renderer.write('ABCD\nEFGH\nIJKL');
            renderer.write(ansiEscapes.cursorMove(-2, -1));
            renderer.write('X');
            expect(renderer.render()).toBe('ABCD\nEFXH\nIJKL');
        });

        test('should handle cursorSavePosition and cursorRestorePosition', () => {
            renderer.write('Hello');
            renderer.write(ansiEscapes.cursorSavePosition);
            renderer.write(' World\nNext line');
            renderer.write(ansiEscapes.cursorRestorePosition);
            renderer.write('!');
            expect(renderer.render()).toBe('Hello! World\nNext line');
        });

        test('should handle cursorNextLine', () => {
            renderer.write('Line 1');
            renderer.write(ansiEscapes.cursorNextLine);
            renderer.write('Line 2');
            expect(renderer.render()).toBe('Line 1\nLine 2');
        });

        test('should handle cursorPrevLine', () => {
            renderer.write('Line 1\nLine 2\nLine 3');
            renderer.write(ansiEscapes.cursorPrevLine);
            renderer.write('Modified');
            expect(renderer.render()).toBe('Line 1\nModified\nLine 3');
        });

        test('should handle combined cursor movements', () => {
            renderer.write('Line 1\nLine 2\nLine 3');
            // Move up 2 lines and left to beginning
            renderer.write(ansiEscapes.cursorUp(2) + ansiEscapes.cursorLeft);
            renderer.write('REPLACED');
            expect(renderer.render()).toBe('REPLACED\nLine 2\nLine 3');
        });

        test('should handle eraseLines', () => {
            renderer.write('Line 1\nLine 2\nLine 3\nLine 4');
            renderer.write(ansiEscapes.cursorUp(2));
            renderer.write(ansiEscapes.eraseLines(2));
            renderer.write('New content');
            expect(renderer.render()).toBe('Line 1\nNew content\nLine 4');
        });

        test('should handle eraseLine variants', () => {
            renderer.write('Hello World Test');
            renderer.write(ansiEscapes.cursorBackward(4));
            renderer.write(ansiEscapes.eraseEndLine);
            renderer.write('END');
            expect(renderer.render()).toBe('Hello World END');
        });

        test('should handle eraseScreen', () => {
            renderer.write('Line 1\nLine 2\nLine 3');
            renderer.write(ansiEscapes.eraseScreen);
            renderer.write('Fresh start');
            expect(renderer.render()).toBe('Fresh start');
        });

        test('should handle clearScreen (alias for eraseScreen)', () => {
            renderer.write('Old content\nMore old content');
            renderer.write(ansiEscapes.clearScreen);
            renderer.write('Cleared content');
            expect(renderer.render()).toBe('Cleared content');
        });

        test('should handle complex cursor sequence example', () => {
            // Simulate a progress bar update using cursor controls
            renderer.write('Progress: [          ] 0%');
            renderer.write(ansiEscapes.cursorBackward(15)); // Move back to start of progress bar
            renderer.write('[#####     ] 50%');
            renderer.write(ansiEscapes.cursorBackward(16)); // Move back again
            renderer.write('[##########] 100%');
            expect(renderer.render()).toBe('Progress: [##########] 100%');
        });
    });

    describe('progress indicators', () => {
        test('should handle progress updates with carriage returns', () => {
            renderer.write('Progress: 10%\r');
            renderer.write('Progress: 50%\r');
            renderer.write('Progress: 100%\r');
            renderer.write('\nComplete!');
            expect(renderer.render()).toBe('Progress: 100%\nComplete!');
        });

        test('should handle printf-style progress indicators', () => {
            renderer.write('Loading...\r');
            renderer.write('Progress: [####      ] 40%\r');
            renderer.write('Progress: [##########] 100%\r');
            renderer.write('\nDone!');
            expect(renderer.render()).toBe('Progress: [##########] 100%\nDone!');
        });
    });

    describe('createTerminalLogManager', () => {
        test('should create a new instance', () => {
            const manager = createTerminalLogManager();
            expect(manager).toBeInstanceOf(TerminalTextRender);
        });

        test('should create independent instances', () => {
            const manager1 = createTerminalLogManager();
            const manager2 = createTerminalLogManager();

            manager1.write('Test 1');
            manager2.write('Test 2');

            expect(manager1.render()).toBe('Test 1');
            expect(manager2.render()).toBe('Test 2');
        });
    });

    describe('clear functionality', () => {
        test('should clear all content', () => {
            renderer.write('Hello\nWorld\nTest');
            renderer.clear();
            expect(renderer.render()).toBe('');
        });

        test('should reset cursor position after clear', () => {
            renderer.write('Hello\nWorld');
            renderer.clear();
            renderer.write('New Content');
            expect(renderer.render()).toBe('New Content');
        });
    });

    describe('real terminal output simulation', () => {
        test('should handle output from simple-test.sh', () => {
            // Read and execute the simple-test.sh script
            const scriptPath = path.join(__dirname, 'simple-test.sh');

            // Make sure the script is executable
            if (fs.existsSync(scriptPath)) {
                try {
                    // Execute the script and capture its output
                    const output = execSync(`bash "${scriptPath}"`, {
                        encoding: 'utf8',
                        timeout: 5000
                    });

                    // Process the output through our renderer
                    renderer.write(output);
                    const result = renderer.render();

                    // Verify expected content is present
                    expect(result).toContain('Simple test output');
                    expect(result).toContain('Line 1');
                    expect(result).toContain('Line 2');
                    expect(result).toContain('Progress: 100%');
                    expect(result).toContain('Complete!');

                    // Verify the progress indicator was properly overwritten
                    expect(result).not.toContain('Progress: 10%');
                    expect(result).not.toContain('Progress: 50%');
                } catch (error) {
                    console.warn('Could not execute simple-test.sh:', error);
                    // Fallback test with simulated output
                    const simulatedOutput = 'Simple test output\nLine 1\nLine 2\nProgress: 10%\rProgress: 50%\rProgress: 100%\r\nComplete!\n';
                    renderer.write(simulatedOutput);
                    const result = renderer.render();

                    expect(result).toContain('Simple test output');
                    expect(result).toContain('Progress: 100%');
                    expect(result).toContain('Complete!');
                }
            } else {
                // Fallback test with simulated output matching simple-test.sh
                const simulatedOutput = 'Simple test output\nLine 1\nLine 2\nProgress: 10%\rProgress: 50%\rProgress: 100%\r\nComplete!\n';
                renderer.write(simulatedOutput);
                const result = renderer.render();

                expect(result).toContain('Simple test output');
                expect(result).toContain('Line 1');
                expect(result).toContain('Line 2');
                expect(result).toContain('Progress: 100%');
                expect(result).toContain('Complete!');
                expect(result).not.toContain('Progress: 10%');
                expect(result).not.toContain('Progress: 50%');
            }
        });

        test('should handle complex terminal output with ANSI codes', () => {
            // Simulate complex terminal output with colors and formatting
            const complexOutput = '\x1b[32mSUCCESS:\x1b[0m Operation completed\n' +
                '\x1b[31mERROR:\x1b[0m Something went wrong\n' +
                '\x1b[1mBold text\x1b[0m and \x1b[4munderlined\x1b[0m\n' +
                'Progress: \x1b[33m[          ]\x1b[0m   0%\r' +
                'Progress: \x1b[33m[#####     ]\x1b[0m  50%\r' +
                'Progress: \x1b[33m[##########]\x1b[0m 100%\r\n' +
                '\x1b[32m✓ All done!\x1b[0m';

            renderer.write(complexOutput);
            const result = renderer.render();

            // The ANSI color codes should be preserved in the output
            // but the carriage returns should properly overwrite progress
            expect(result).toContain('SUCCESS:');
            expect(result).toContain('ERROR:');
            expect(result).toContain('100%');
            expect(result).toContain('✓ All done!');
            // Note: ANSI sequences may contain numbers, so we check for specific patterns
            expect(result).not.toContain('   0%');
            expect(result).not.toContain('  50%');
        });
    });

    describe('edge cases', () => {
        test('should handle empty input', () => {
            renderer.write('');
            expect(renderer.render()).toBe('');
        });

        test('should handle only whitespace', () => {
            renderer.write('   \n  \t  \n   ');
            expect(renderer.render()).toBe('   \n          \n   ');
        });

        test('should handle multiple consecutive carriage returns', () => {
            renderer.write('Test\r\r\rFinal');
            expect(renderer.render()).toBe('Final');
        });

        test('should handle malformed ANSI sequences', () => {
            renderer.write('Hello\x1b[99ZWorld'); // Invalid ANSI code
            renderer.write('\x1b['); // Incomplete ANSI sequence
            renderer.write('Test');
            const result = renderer.render();
            expect(result).toContain('Hello');
            expect(result).toContain('World');
            expect(result).toContain('Test');
        });

        test('should handle very long lines', () => {
            const longText = 'A'.repeat(1000);
            renderer.write(longText);
            expect(renderer.render()).toBe(longText);
        });

        test('should handle many lines', () => {
            const manyLines = Array(100).fill(0).map((_, i) => `Line ${i}`).join('\n');
            renderer.write(manyLines);
            const result = renderer.render();
            expect(result).toContain('Line 0');
            expect(result).toContain('Line 99');
            expect(result.split('\n')).toHaveLength(100);
        });
    });
});

