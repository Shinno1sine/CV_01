import { Command, Console, createSpinner } from 'nestjs-console';

@Console({
  command: 'hello',
  description: 'Demo for NestJS Command',
})
export class HelloCommand {
  @Command({
    command: 'hello <name>',
    description: 'Hello name log',
  })
  async helloCommand(name: string): Promise<void> {
    const spin = createSpinner();
    spin.start('START');
    try {
      await new Promise((done) =>
        setTimeout(() => done(`Hello ${name}`), 1000),
      );
      console.log(`Hello, ${name}`);
      spin.succeed('SUCCEED');
    } catch (error) {
      console.error('🚀 ~ helloCommand ~ error', error);
      spin.start('FAILED');
    }
  }
}
