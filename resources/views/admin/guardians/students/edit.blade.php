<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Link Students to Guardian: ') }} {{ $guardian->user->name }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <form method="POST" action="{{ route('admin.guardians.students.update', $guardian) }}">
                        @csrf
                        @method('PUT')

                        <div class="space-y-4">
                            <label class="block font-medium text-sm text-gray-700">{{ __('Select Students') }}</label>

                            @foreach ($students as $student)
                                <div class="flex items-center">
                                    <input type="checkbox" name="students[]" value="{{ $student->id }}" id="student_{{ $student->id }}"
                                        class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        @if(in_array($student->id, $linkedStudentIds)) checked @endif
                                    >
                                    <label for="student_{{ $student->id }}" class="ml-2 block text-sm text-gray-900">
                                        {{ $student->user->name }}
                                    </label>
                                </div>
                            @endforeach
                        </div>

                        <div class="flex items-center justify-end mt-4">
                            <button type="submit" class="ml-4 inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150">
                                {{ __('Update Links') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
