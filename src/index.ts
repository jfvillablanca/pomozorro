import { Duration, Effect, pipe } from 'effect';
import { beep } from 'ansi-escapes';
import { decrement } from 'effect/Number';
import { Bar, Presets } from 'cli-progress';
import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';

// TODO:
// remove hardcoded duration
const phaseDuration = Duration.minutes(5);

const progressBar = new Bar(
    {
        stopOnComplete: true,
        clearOnComplete: true,
        format: '{timeRemaining} [{bar}] {percentage}%',
    },
    Presets.shades_grey,
);

const formatDuration = (duration: Duration.Duration) => {
    const oneMinute = Duration.toSeconds(Duration.minutes(1));
    const totalSeconds = Duration.toSeconds(duration);
    const minutes = Math.floor(totalSeconds / oneMinute);
    const seconds = totalSeconds % oneMinute;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

progressBar.start(Duration.toSeconds(phaseDuration), 0, {
    timeRemaining: formatDuration(phaseDuration),
});

const countdown = (
    remaining: Duration.Duration,
): Effect.Effect<Duration.Duration> =>
    pipe(
        Effect.succeed(remaining),
        Effect.tap((remaining) => {
            progressBar.update(
                Duration.toSeconds(phaseDuration) -
                    Duration.toSeconds(remaining),
                {
                    timeRemaining: formatDuration(remaining),
                },
            );
        }),
        Effect.tap(Effect.sleep('1 second')),
        Effect.flatMap((remaining) =>
            Duration.isZero(remaining)
                ? Effect.succeed(Duration.zero)
                : Effect.suspend(() =>
                      countdown(
                          pipe(
                              remaining,
                              Duration.toSeconds,
                              decrement,
                              Duration.seconds,
                          ),
                      ),
                  ),
        ),
    );

const main = pipe(
    countdown(phaseDuration),
    Effect.tap(() => {
        const message = '\nTime is up!' + beep;
        process.stdout.write(message);
    }),
);

const command = Command.make('default').pipe(
    Command.withDescription('Just some basic pomodoro timer for productivity'),
    Command.withHandler(() => main),
);

const cli = Command.run(command, {
    name: 'Pomozorro',
    version: 'v0.0.1',
});

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
