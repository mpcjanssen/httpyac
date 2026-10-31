import { log } from '../../io';
import { ProcessorContext, VariableType } from '../../models';
import * as utils from '../../utils';
import { evalExpression } from './moduleUtils';

export async function replaceJavascriptExpressions(
  text: unknown,
  type: VariableType | string,
  context: ProcessorContext
): Promise<unknown> {
  return await utils.parseHandlebarsString(text, async (variable: string, searchValue: string) => {
    try {
      return await evalExpression(variable, context);
    } catch (err) {
      if (type === VariableType.variable) {
        (context.scriptConsole || log).debug(`variable ${variable} not defined`);
        // a ReferenceError names only the part before the first operator (e.g. `my` for `my-var`), so it would be misleading
        if ((err as Error)?.name !== 'ReferenceError') {
          (context.scriptConsole || log).debug(err);
        }
      } else {
        (context.scriptConsole || log).error(`expression ${variable} throws error`);
        if ((err as Error)?.name === 'ReferenceError') {
          throw new Error(`${variable} is not defined`);
        }
        throw err;
      }
      return searchValue;
    }
  });
}
